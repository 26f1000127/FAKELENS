"""FastAPI application: knowledge-base ingestion + content review API.

All endpoints are company-scoped via the `X-Company-Id` header. Mutating
endpoints additionally require `X-API-Key` (admin key, settings.admin_api_key).
Company isolation is enforced at the data layer (vectorstore) and re-checked
here; one company can only ever see/modify its own documents and reviews.
"""
from __future__ import annotations

import hmac
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from spyglass import ingest, parse as parsing, review as reviewmod
from spyglass.config import settings
from spyglass.db import connect, init_schema, load_json, new_id, write_txn


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_schema()
    yield


app = FastAPI(title="Brand Governance RAG Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8100",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    # Constant-time comparison: a plain == leaks the key length/prefix through
    # timing on the admin credential.
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.admin_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")


# --------------------------------------------------------------------------- #
# Companies
# --------------------------------------------------------------------------- #

class CompanyIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)


@app.post("/companies", status_code=201)
def create_company(body: CompanyIn, _: None = Depends(require_api_key)) -> dict:
    company_id = new_id("cmp")
    conn = connect()
    try:
        with write_txn(conn):
            conn.execute("INSERT INTO companies (id, name) VALUES (?,?)", (company_id, body.name))
    finally:
        conn.close()
    return {"company_id": company_id, "name": body.name}


@app.get("/companies")
def list_companies(_: None = Depends(require_api_key)) -> dict:
    conn = connect()
    try:
        rows = conn.execute("SELECT id, name, created_at FROM companies ORDER BY created_at").fetchall()
        return {"companies": [dict(r) for r in rows]}
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Knowledge-base ingestion
# --------------------------------------------------------------------------- #

@app.post("/companies/{company_id}/documents", status_code=202)
async def upload_document(
    company_id: str,
    file: Annotated[UploadFile, File()],
    doc_type: Annotated[str, Form()],
    title: Annotated[str | None, Form()] = None,
    effective_date: Annotated[str | None, Form()] = None,
    expires_date: Annotated[str | None, Form()] = None,
    _: None = Depends(require_api_key),
) -> dict:
    """Upload a company document (PDF/DOCX/TXT/MD) into the knowledge base."""
    _ensure_company(company_id)
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 25 MiB)")
    try:
        result: dict = ingest.ingest_document(
            company_id, title, doc_type, file.filename or "upload.txt", data,
            effective_date=effective_date, expires_date=expires_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    if result.pop("duplicate", False):
        return JSONResponse(
            status_code=200,
            content={"status": "duplicate_ignored", "document_id": result["document_id"],
                     "version": result["version"]},
        )
    return result


@app.get("/companies/{company_id}/documents")
def list_documents(company_id: str, _: None = Depends(require_api_key)) -> dict:
    _ensure_company(company_id)
    return {"documents": ingest.list_documents(company_id)}


@app.get("/companies/{company_id}/documents/{document_id}")
def get_document(company_id: str, document_id: str, _: None = Depends(require_api_key)) -> dict:
    _ensure_company(company_id)
    doc = ingest.get_document(company_id, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="document not found")
    return doc


@app.delete("/companies/{company_id}/documents/{document_id}")
def delete_document(
    company_id: str, document_id: str, mode: str = "retire",
    _: None = Depends(require_api_key),
) -> dict:
    """`mode=retire` (default): soft-retire; `mode=hard`: actually erase."""
    _ensure_company(company_id)
    if mode == "retire":
        ok = ingest.retire_document(company_id, document_id)
    elif mode == "hard":
        ok = ingest.hard_delete_document(company_id, document_id)
    else:
        raise HTTPException(status_code=422, detail="mode must be 'retire' or 'hard'")
    if not ok:
        raise HTTPException(status_code=404, detail="document not found")
    return {"status": "ok", "mode": mode, "document_id": document_id}


# --------------------------------------------------------------------------- #
# Review submission + read
# --------------------------------------------------------------------------- #

class ReviewIn(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content: str = Field(min_length=1)


@app.post("/companies/{company_id}/reviews", status_code=200)
def create_review(company_id: str, body: ReviewIn, _: None = Depends(require_api_key)) -> dict:
    """Assign a review ID and run the pipeline; returns the full review payload."""
    _ensure_company(company_id)
    info = reviewmod.create_review(company_id, body.title, body.content)
    reviewmod.execute_review_safe(info["id"])   # synchronous-bound; status reflects actual state
    payload = reviewmod.get_review_payload(info["id"])
    if payload:
        return payload
    return {"review_id": info["id"], "status": "queued", "company_id": company_id}


@app.post("/companies/{company_id}/reviews/upload", status_code=200)
async def create_review_file(
    company_id: str,
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
    _: None = Depends(require_api_key),
) -> dict:
    """Accept a document file (PDF/DOCX/TXT/MD), parse its content, and run the review pipeline."""
    _ensure_company(company_id)
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 25 MiB)")

    storage_dir = Path(".data/tmp_reviews") / company_id
    storage_dir.mkdir(parents=True, exist_ok=True)
    filename = file.filename or "upload.txt"
    tmp_path = storage_dir / f"{new_id('tmp')}_{filename}"
    tmp_path.write_bytes(data)
    try:
        parsed = parsing.parse_document(tmp_path)
        content_text = parsed.full_text
        content_title = (title or "").strip() or parsed.title[:200] or Path(filename).stem
    finally:
        tmp_path.unlink(missing_ok=True)

    if not content_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from uploaded file")

    info = reviewmod.create_review(company_id, content_title, content_text)
    reviewmod.execute_review_safe(info["id"])
    payload = reviewmod.get_review_payload(info["id"])
    if payload:
        return payload
    return {"review_id": info["id"], "status": "queued", "company_id": company_id}


@app.get("/companies/{company_id}/reviews/{review_id}")
def get_review(company_id: str, review_id: str, _: None = Depends(require_api_key)) -> Any:
    _ensure_company(company_id)
    payload = reviewmod.get_review_payload(review_id)
    if not payload:
        raise HTTPException(status_code=404, detail="review not found")
    if payload["company_id"] != company_id:
        raise HTTPException(status_code=404, detail="review not found")
    return payload


@app.get("/companies/{company_id}/reviews")
def list_reviews(company_id: str, _: None = Depends(require_api_key)) -> dict:
    _ensure_company(company_id)
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT id, status, overall_status, content_title, summary, result_json, created_at, completed_at"
            " FROM reviews WHERE company_id=? ORDER BY created_at DESC LIMIT 200",
            (company_id,),
        ).fetchall()
        reviews = []
        for r in rows:
            d = dict(r)
            raw_json = d.pop("result_json", None)
            if raw_json:
                parsed = load_json(raw_json, {})
                if parsed:
                    d["severity_counts"] = parsed.get("severity_counts")
                    d["summary"] = parsed.get("summary", d.get("summary"))
                    d["findings_count"] = len(parsed.get("findings", []))
                    d["findings"] = parsed.get("findings", [])
                    d["suggested_fixes_count"] = len([f for f in parsed.get("findings", []) if f.get("suggestion")])
            reviews.append(d)
        return {"reviews": reviews}
    finally:
        conn.close()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "offline_mode": settings.offline_mode,
        "chat_model": settings.chat_model,
        "embedding_model": "//offline-hash" if settings.offline_mode else settings.embedding_model,
    }


def _ensure_company(company_id: str) -> None:
    conn = connect()
    try:
        r = conn.execute("SELECT 1 FROM companies WHERE id=?", (company_id,)).fetchone()
    finally:
        conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="company not found")
