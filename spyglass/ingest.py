"""Document ingestion: parse -> chunk -> embed -> persist, with dedup & versioning.

Versioning rules:
  - Same company + same file hash (byte-identical upload): duplicate, no-op.
  - Same company + same title + different content: replaces the previous
    'active' version -- the old document is marked 'superseded' and its chunks
    are removed from the active index so obsolete chunks can never be
    retrieved. The old row & metadata remain for traceability.
  - status='retired' or 'superseded' documents are excluded from retrieval.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from spyglass import chunking, parse as parsing, vectorstore
from spyglass.db import connect, dump_json, load_json, new_id, write_txn

ALLOWED_TYPES = {"brand_guideline", "policy", "product_spec", "approved_claims",
                 "publication", "legal", "terminology", "fact_sheet",
                 "announcement", "press_release", "other"}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".markdown", ".doc"}


def _hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def ingest_document(
    company_id: str,
    title: str | None,
    doc_type: str,
    filename: str,
    data: bytes,
    *,
    effective_date: str | None = None,
    expires_date: str | None = None,
    extra_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Ingest one uploaded document; returns ingestion outcome metadata."""
    if doc_type not in ALLOWED_TYPES:
        raise ValueError("unsupported doc_type: %s" % doc_type)
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("unsupported file extension: %s" % ext)

    file_hash = _hash_bytes(data)
    storage_dir = Path(".data/uploads") / company_id
    storage_dir.mkdir(parents=True, exist_ok=True)

    conn = connect()
    # Rollback guards: may be referenced by the except path for failures that
    # happen after the document row was inserted.
    doc_id: str | None = None
    path: Path | None = None
    old_id: str | None = None

    # ---- Duplicate detection (company-scoped, byte-identical content) ---- #
    try:
        dup = conn.execute(
            "SELECT d.id, d.version, d.title, d.status FROM documents d"
            " WHERE d.company_id=? AND d.file_hash=? ORDER BY d.created_at DESC LIMIT 1",
            (company_id, file_hash),
        ).fetchone()
        if dup:
            prev = dict(dup)
            prev["duplicate"] = True
            return {"duplicate": True, "document_id": prev["id"], "version": prev["version"]}

        final_title = (title or "").strip()
        if not final_title:
            tmp = storage_dir / filename
            tmp.write_bytes(data)
            parsed = parsing.parse_document(tmp)
            final_title = parsed.title[:200] or Path(filename).stem
            tmp.unlink(missing_ok=True)

        # ---- Version chain: replace any same-title active document ---- #
        old = conn.execute(
            "SELECT id, version FROM documents"
            " WHERE company_id=? AND title=? AND status='active'"
            " ORDER BY version DESC LIMIT 1",
            (company_id, final_title),
        ).fetchone()
        old_version = dict(old)["version"] if old else 0
        old_id = old["id"] if old else None
        doc_id = new_id("doc")

        path = storage_dir / f"{doc_id}_{Path(filename).name}"
        path.write_bytes(data)
        parsed = parsing.parse_document(path)

        chunks = chunking.chunk_blocks(parsed.blocks)
        my_version = old_version + 1
        with write_txn(conn):
            if old:
                conn.execute(
                    "UPDATE documents SET status='superseded', superseded_at=datetime('now') WHERE id=?",
                    (old["id"],),
                )
            conn.execute(
                "INSERT INTO documents (id, company_id, title, doc_type, version, status,"
                " effective_date, expires_date, filename, storage_path, file_hash, meta_json)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (doc_id, company_id, final_title, doc_type, my_version, "active",
                 effective_date, expires_date, filename, str(path), file_hash,
                 dump_json(extra_meta or {})),
            )
        # ---- Chunk + embed + index (only the new version's chunks) ---- #
        rows = []
        for i, ch in enumerate(chunks):
            rows.append({
                "id": new_id("chk"),
                "chunk_index": i,
                "text": ch.text,
                "section": ch.section,
                "page": ch.page,
                "meta_json": dump_json({"title": final_title, "doc_type": doc_type}),
            })
        vectorstore.upsert_chunks(company_id, doc_id, rows)
        # ---- Remove the old version's chunks from the readable index ---- #
        if old:
            vectorstore.delete_chunks_for_document(old["id"])
        return {"duplicate": False, "document_id": doc_id, "version": my_version,
                "chunks": len(rows), "title": final_title}
    except Exception:
        # Roll back a half-ingested document (embedding/DB failure): no
        # 'active' doc may survive without its chunks, and the superseded
        # predecessor must stay retrievable.
        if doc_id is not None:
            try:
                # Index rows first: chunks_fts has no FK cascade, so clear them
                # while the chunks still exist, then drop the row (cascades
                # chunks/embeddings), then restore the predecessor.
                vectorstore.delete_chunks_for_document(doc_id)
                with write_txn(conn):
                    conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
                    if old_id:
                        conn.execute(
                            "UPDATE documents SET status='active', superseded_at=NULL WHERE id=?",
                            (old_id,),
                        )
                if path is not None:
                    path.unlink(missing_ok=True)
            except Exception:
                pass  # best-effort cleanup; the original error still propagates
        raise
    finally:
        conn.close()


def retire_document(company_id: str, document_id: str) -> bool:
    """Soft-retire: document stays for traceability but never feeds retrieval."""
    conn = connect()
    try:
        with write_txn(conn):
            cur = conn.execute(
                "UPDATE documents SET status='retired', superseded_at=datetime('now')"
                " WHERE id=? AND company_id=? AND status='active'",
                (document_id, company_id),
            )
            n = cur.rowcount
        if n:
            vectorstore.delete_chunks_for_document(document_id)
        return bool(n)
    finally:
        conn.close()


def hard_delete_document(company_id: str, document_id: str) -> bool:
    """Erase the row, its chunks and its file (traceability is opt-in)."""
    conn = connect()
    try:
        r = conn.execute(
            "SELECT storage_path FROM documents WHERE id=? AND company_id=?",
            (document_id, company_id),
        ).fetchone()
        if not r:
            return False
        # Delete index rows first: chunks_fts has no FK cascade, so removing
        # the document first would orphan its FTS entries (chunks cascade away
        # with the document, leaving the cleanup with nothing to match).
        vectorstore.delete_chunks_for_document(document_id)
        with write_txn(conn):
            conn.execute("DELETE FROM documents WHERE id=? AND company_id=?", (document_id, company_id))
        Path(r["storage_path"]).unlink(missing_ok=True)
        return True
    finally:
        conn.close()


def list_documents(company_id: str) -> list[dict[str, Any]]:
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT id, title, doc_type, version, status, effective_date, expires_date,"
            " filename, created_at, superseded_at, meta_json FROM documents"
            " WHERE company_id=? ORDER BY created_at DESC",
            (company_id,),
        ).fetchall()
        out = [dict(r) for r in rows]
        for d in out:
            d["meta"] = load_json(d.pop("meta_json"), {})
        return out
    finally:
        conn.close()


def get_document(company_id: str, document_id: str) -> dict[str, Any] | None:
    for d in list_documents(company_id):
        if d["id"] == document_id:
            return d
    return None
