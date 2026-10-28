"""Regression tests for robustness fixes (no network, offline mode).

Covers:
  - _finalize survives malformed model severity values (used to KeyError and
    fail the whole review)
  - token-less queries can no longer break the FTS5 MATCH expression
  - hard delete purges FTS/embedding/chunk rows (chunks_fts has no FK cascade)
  - failed indexing rolls the document back and restores the superseded
    predecessor as active
  - token-less queries still return semantic-only results end to end
"""
from __future__ import annotations

import pathlib
import sqlite3

import pytest
from fastapi.testclient import TestClient

from spyglass import review as reviewmod
from spyglass.config import settings
from spyglass.vectorstore import _fts_query, search_hybrid

EVIDENCE = [
    {
        "chunk_id": "chk_000000000001",
        "document_id": "doc_000000000001",
        "title": "Policy Handbook",
        "section": "Returns",
        "page": 3,
        "doc_type": "policy",
        "version": 1,
        "status": "active",
        "text": "Customers must not be promised cash refunds beyond 14 days.",
        "score": 0.91,
    },
]


def test_finalize_survives_invalid_model_severity() -> None:
    content = "We promise cash refunds for 60 days, guaranteed."
    data = {
        "findings": [
            # "urgent" is not a valid severity; None is not either.
            {"category": "policy_compliance", "severity": "urgent",
             "quote": content, "explanation": "conflicts with the handbook",
             "evidence_ids": ["E1"], "confidence": 0.9},
            {"category": "factual_accuracy", "severity": None,
             "quote": content, "explanation": "second malformed row",
             "evidence_ids": ["E1"], "confidence": 0.4},
        ],
        "unverified_claims": [],
        "areas_for_human_review": [],
        "overall_summary": "risk",
    }
    result = reviewmod._finalize(data, content, EVIDENCE, reviewer="llm", retrieval_ms=5)
    assert len(result["findings"]) == 2
    assert all(f["severity"] in reviewmod.SEVERITIES for f in result["findings"])
    assert result["overall_status"] in ("PASS", "NEEDS_REVIEW", "BLOCKED")


def test_fts_query_handles_tokenless_input() -> None:
    assert _fts_query("hello world") == '"hello" OR "world"'
    assert _fts_query("。。。 !!! ???") is None
    assert _fts_query("") is None


def _count(db_path: pathlib.Path, table: str) -> int:
    conn = sqlite3.connect(str(db_path))
    try:
        return conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
    finally:
        conn.close()


def test_hard_delete_purges_index_rows(client: TestClient, tmp_path: pathlib.Path) -> None:
    cid = client.post("/companies", json={"name": "Acme"}).json()["company_id"]
    md = tmp_path / "doc.md"
    md.write_text("## Rules\nRefunds are processed within 7 days.", encoding="utf-8")
    with md.open("rb") as f:
        up = client.post(
            f"/companies/{cid}/documents",
            files={"file": ("doc.md", f, "text/markdown")},
            data={"doc_type": "policy", "title": "Rules"},
        )
    assert up.status_code == 202, up.text
    doc_id = up.json()["document_id"]

    assert _count(settings.db_path, "chunks_fts") > 0

    r = client.delete(f"/companies/{cid}/documents/{doc_id}?mode=hard")
    assert r.status_code == 200, r.text
    for table in ("chunks_fts", "chunks", "embeddings", "documents"):
        assert _count(settings.db_path, table) == 0, table


def test_failed_indexing_rolls_back_document(
    client: TestClient, tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    cid = client.post("/companies", json={"name": "Acme"}).json()["company_id"]
    v1 = tmp_path / "v1.md"
    v1.write_text("## v1\nBattery lasts 18 hours.", encoding="utf-8")
    with v1.open("rb") as f:
        first = client.post(
            f"/companies/{cid}/documents",
            files={"file": ("v1.md", f, "text/markdown")},
            data={"doc_type": "product_spec", "title": "Manual"},
        )
    assert first.status_code == 202, first.text

    from spyglass import vectorstore

    def _boom(*a, **kw):
        raise RuntimeError("embedding backend down")

    monkeypatch.setattr(vectorstore, "upsert_chunks", _boom)

    v2 = tmp_path / "v2.md"
    v2.write_text("## v2\nBattery lasts 20 hours.", encoding="utf-8")
    with v2.open("rb") as f:
        with pytest.raises(RuntimeError):
            client.post(
                f"/companies/{cid}/documents",
                files={"file": ("v2.md", f, "text/markdown")},
                data={"doc_type": "product_spec", "title": "Manual"},
            )

    docs = client.get(f"/companies/{cid}/documents").json()["documents"]
    active = [d for d in docs if d["status"] == "active"]
    assert len(active) == 1 and active[0]["version"] == 1  # predecessor restored
    assert not any(d["version"] == 2 for d in docs)        # failed upload rolled back
    assert _count(settings.db_path, "chunks") == 1
    # the partially-written upload file is cleaned up too
    leftovers = list(pathlib.Path(".data/uploads").glob(f"{cid}/*v2*"))
    assert leftovers == []


@pytest.fixture
def company_with_kb(client: TestClient, tmp_path: pathlib.Path):
    cid = client.post("/companies", json={"name": "KB"}).json()["company_id"]
    md = tmp_path / "kb.md"
    md.write_text(
        "# Guide\n\nNever exceed 100 volts. Warranty period is 2 years.",
        encoding="utf-8",
    )
    with md.open("rb") as f:
        r = client.post(
            f"/companies/{cid}/documents",
            files={"file": ("kb.md", f, "text/markdown")},
            data={"doc_type": "policy", "title": "Guide"},
        )
    assert r.status_code == 202, r.text
    return client, cid


def test_search_handles_tokenless_query(company_with_kb) -> None:
    client, cid = company_with_kb
    # No usable FTS tokens: must degrade to semantic-only scoring, not 500.
    assert isinstance(search_hybrid(cid, "!!! ??? ...", top_k=5), list)
    # Normal path still retrieves.
    hits = search_hybrid(cid, "warranty 100 volts", top_k=5)
    assert hits and hits[0]["title"] == "Guide"