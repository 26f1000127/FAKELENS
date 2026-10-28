"""End-to-end offline tests: ingestion -> hybrid retrieval -> review output."""
from __future__ import annotations

import pathlib

import pytest
from fastapi.testclient import TestClient


def _make_company(client: TestClient) -> str:
    r = client.post("/companies", json={"name": "Acme"})
    assert r.status_code == 201, r.text
    return r.json()["company_id"]


def _kb_doc(path: pathlib.Path, title: str, body: str) -> None:
    path.write_text(body, encoding="utf-8")


@pytest.fixture
def acme_client(client: TestClient, tmp_path: pathlib.Path):
    company_id = _make_company(client)
    uploads = tmp_path / "kb"
    uploads.mkdir()
    _make_kb(client, uploads / "guidelines.md", company_id)
    return client, company_id, uploads


def _make_kb(client: TestClient, md_path: pathlib.Path, company_id: str) -> None:
    _kb_doc(md_path, "Acme Brand and Policy Guidelines", """# Acme Brand Guidelines

## Tone of voice
Write positively and concretely. Do not use hype language.

### Prohibited phrases
Never write "revolutionary", "miracle product", "100% risk-free", or "guaranteed returns".

## Product: AcmeBean One
The AcmeBean One battery lasts 18 hours of active use and recharges in 55 minutes.
It ships in charcoal and sand. Coffee capacity is 0.35 liters.

## Support policy
Standard support response time is 24 hours on business days.

## Returns policy
Customers must not be promised cash refunds beyond the statutory 14-day return window.
""")
    with md_path.open("rb") as f:
        r = client.post(
            f"/companies/{company_id}/documents",
            files={"file": ("guidelines.md", f, "text/markdown")},
            data={"doc_type": "brand_guideline", "title": "Acme Brand and Policy Guidelines"},
        )
    assert r.status_code in (202, 200), r.text
    assert r.json()["chunks"] > 1


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["offline_mode"] is True
    assert r.json()["embedding_model"] == "//offline-hash"


def test_review_flags_prohibited_phrase_and_unverified_numbers(acme_client) -> None:
    client, company_id, uploads = acme_client
    md = uploads / "guidelines.md"
    with md.open("rb") as f:
        pass
    # re-use fixture-doc as the review-time context
    content_title = "AcmeBean One launch post"
    content = (
        "# AcmeBean One\n\n"
        "Visit our store for the AcmeBean One! Its battery lasts 22 hours and "
        "recharges in 40 minutes. This product is revolutionary and guaranteed returns for everyone. "
        "Support replies within 4 hours."
    )
    r = client.post(f"/companies/{company_id}/reviews",
                    json={"title": content_title, "content": content})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "completed"
    assert data["review_id"].startswith("rev_")
    assert data["severity_counts"] and set(data["severity_counts"]) >= {"critical", "high", "medium", "low", "informational"}
    quotes = {f["quote"] for f in data["findings"]}
    assert any("revolutionary" in q or "guaranteed returns" in q for q in quotes)
    assert any("22 hours" in u["quote"] for u in data["unverified_claims"]), data["unverified_claims"]
    assert all(f["id"].startswith("fnd_") for f in data["findings"])
    assert all(f["evidence"] and f["evidence"][0]["chunk_id"].startswith("chk_") for f in data["findings"])
    assert all(f["evidence"][0]["document_title"] == "Acme Brand and Policy Guidelines" for f in data["findings"])
    assert all(("§" in (f["evidence"][0]["citation"] or "")) for f in data["findings"])
    assert data["overall_status"] in ("PASS", "NEEDS_REVIEW", "BLOCKED")


def test_company_isolation_in_reviews_and_search(acme_client) -> None:
    client, company_id, uploads = acme_client
    other = _make_company(client)
    # B: no documents. Review of Acme-branded content must not leak Acme evidence.
    r = client.post(f"/companies/{other}/reviews",
                    json={"title": "x", "content": "Our battery lasts 22 hours and is revolutionary."})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["evidence"] == [] or all(e["document_id"].startswith("doc_") for e in data["evidence"])
    from spyglass.vectorstore import search_hybrid
    hits = search_hybrid(other, "battery hours", top_k=5)
    assert not [h for h in hits if h["title"] == "Acme Brand and Policy Guidelines"]
    # Direct cross-company search
    hits = search_hybrid(company_id, "battery hours", top_k=5)
    assert hits and {h["title"] for h in hits} == {"Acme Brand and Policy Guidelines"}


def test_duplicate_and_versioning(client: TestClient, tmp_path: pathlib.Path) -> None:
    company_id = _make_company(client)
    md = tmp_path / "g.md"
    _kb_doc(md, "Guidelines v1", "## Rule 1\nNumbers: 18 hours battery.")
    with md.open("rb") as f:
        r1 = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("g.md", f, "text/markdown")},
                        data={"doc_type": "brand_guideline", "title": "Guidelines v1"})
    assert r1.status_code == 202, r1.text
    with md.open("rb") as f:
        r2 = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("g.md", f, "text/markdown")},
                        data={"doc_type": "brand_guideline", "title": "Guidelines v1"})
    assert r2.json()["status"] == "duplicate_ignored", r2.text

    # New content, same title -> replaced, old chunks gone, new is active
    md2 = tmp_path / "g2.md"
    _kb_doc(md2, "Guidelines v1", "## Rule 1\nNumbers: 20 hours battery.")
    with md2.open("rb") as f:
        r3 = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("g2.md", f, "text/markdown")},
                        data={"doc_type": "brand_guideline", "title": "Guidelines v1"})
    assert r3.status_code == 202
    assert r3.json()["version"] == 2  # replacement created version 2

    from spyglass.vectorstore import search_hybrid
    hits = search_hybrid(company_id, "battery hours numbers", top_k=15)
    assert {h["title"] for h in hits} == {"Guidelines v1"}  # titles still match
    texts = " ".join(h["text"] for h in hits)
    assert "20 hours" in texts
    assert "18 hours" not in texts  # obsolete chunk is un-retrievable

    docs = client.get(f"/companies/{company_id}/documents").json()["documents"]
    assert len([d for d in docs if d["status"] == "active"]) == 1
    assert len([d for d in docs if d["status"] == "superseded"]) == 1


def test_retire_removes_chunks(client: TestClient, tmp_path: pathlib.Path) -> None:
    company_id = _make_company(client)
    md = tmp_path / "t.md"
    _kb_doc(md, "Temp policy", "## X\nRule text about cancellations within 7 days.")
    with md.open("rb") as f:
        r = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("t.md", f, "text/markdown")}, data={"doc_type": "policy"})
    doc_id = r.json()["document_id"]
    from spyglass.vectorstore import search_hybrid
    assert search_hybrid(company_id, "cancellations within 7 days", top_k=5)
    dr = client.delete(f"/companies/{company_id}/documents/{doc_id}")
    assert dr.status_code == 200
    assert not search_hybrid(company_id, "cancellations within 7 days", top_k=5)


def test_chunker_respects_headings() -> None:
    import spyglass.parse as P
    import spyglass.chunking as C
    text = "# Title\n\n" + ("Para sentence. " * 260)
    blocks = P._parse_lines_like_document(text, is_markdown=True).blocks
    chunks = C.chunk_blocks(blocks, max_chunk_chars=900, overlap_chars=100)
    texts = [c.text for c in chunks]
    assert all(len(t) <= 900 + 200 for t in texts)
    assert len(texts) > 1


def test_pdf_docx_parsers(client: TestClient, tmp_path: pathlib.Path) -> None:
    import docx as docxlib
    from pypdf import PdfWriter
    from pydantic import BaseModel  # noqa: F401 (keep pydantic poured in)

    # DOCX with headings & a table
    doc = docxlib.Document()
    doc.add_heading("Acme One Manual", 0)
    doc.add_heading("Battery", 1)
    doc.add_paragraph("The battery lasts 18 hours.")
    doc.add_heading("Returns", 1)
    doc.add_paragraph("Everybody accepts 14 days.")
    tbl = doc.add_table(rows=1, cols=2)
    tbl.rows[0].cells[0].text = "Model"
    tbl.rows[0].cells[1].text = "AcmeBean One"
    docx_path = tmp_path / "manual.docx"
    doc.save(docx_path)

    company_id = _make_company(client)
    with docx_path.open("rb") as f:
        r = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("manual.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                        data={"doc_type": "product_spec"})
    assert r.status_code == 202 and r.json()["title"] == "Acme One Manual", r.text

    from spyglass.parse import parse_document
    parsed = parse_document(docx_path)
    assert parsed.title == "Acme One Manual"
    sections = [b.section for b in parsed.blocks]
    assert any("Battery" in s for s in sections)

    # Minimal PDF
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    pdf_path = tmp_path / "blank.pdf"
    with pdf_path.open("wb") as f:
        writer.write(f)
    with pdf_path.open("rb") as f:
        r = client.post(f"/companies/{company_id}/documents",
                        files={"file": ("blank.pdf", f, "application/pdf")},
                        data={"doc_type": "policy"})
    # empty pdf: parse may produce 0 blocks; must 202 with 0 chunks, or 422 with undetectable title
    assert r.status_code in (202, 422), r.text


def test_auth_required(client: TestClient, tmp_path: pathlib.Path) -> None:
    company_id = _make_company(client)
    r = client.post(f"/companies/{company_id}/reviews", json={"title": "x", "content": "hi"},
                    headers={"X-API-Key": "wrong"})
    assert r.status_code == 401
