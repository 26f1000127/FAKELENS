"""Embedding storage + hybrid retrieval with strict per-company isolation.

Search = weighted blend of
  - cosine similarity over `embeddings`, and
  - keyword evidence via FTS5 (`chunks_fts`).
Every query slices only chunks of a single company_id; the isolation filter is
mandatory, never optional, at every entry point.
"""
from __future__ import annotations

import math
import re
from typing import Sequence

from spyglass.config import settings
from spyglass.db import connect, pack_vector, unpack_vector, write_txn
from spyglass.llm import embed_texts_any

_FTS_TOKEN = re.compile(r"\w{2,}", re.UNICODE)

try:
    from math import sumprod as _sumprod  # C-level dot product (Python 3.12+)
except ImportError:  # pragma: no cover - older interpreters
    def _sumprod(a: Sequence[float], b: Sequence[float]) -> float:
        return sum(x * y for x, y in zip(a, b))


def _current_model() -> str:
    """Model label for vectors written and read under the current mode.

    Online and offline vectors live in different spaces with different
    dimensions, so reads filter on the label: mixing them would silently
    truncate cosine to the shorter vector and rank garbage.
    """
    return "offline-hash-256" if settings.offline_mode else settings.embedding_model

# --------------------------------------------------------------------------- #
# Writes
# --------------------------------------------------------------------------- #

def upsert_chunks(company_id: str, document_id: str, rows: Sequence[dict]) -> None:
    """rows: dicts with id, chunk_index, text, section, page, meta_json. Embeds + persists."""
    if not rows:
        return
    vecs = embed_texts_any([r["text"] for r in rows])
    model_name = _current_model()
    conn = connect()
    try:
        with write_txn(conn):
            for row, vec in zip(rows, vecs):
                conn.execute(
                    "INSERT INTO chunks (id, document_id, company_id, chunk_index, text, section, page, char_start, char_end, meta_json)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        row["id"], document_id, company_id, row["chunk_index"],
                        row["text"], row.get("section"), row.get("page"),
                        row.get("char_start"), row.get("char_end"), row.get("meta_json", "{}"),
                    ),
                )
                conn.execute(
                    "INSERT OR REPLACE INTO embeddings (chunk_id, model, dim, vector) VALUES (?,?,?,?)",
                    (row["id"], model_name, len(vec), pack_vector(vec)),
                )
                conn.execute(
                    "INSERT INTO chunks_fts (chunk_id, text) VALUES (?,?)",
                    (row["id"], row["text"]),
                )
    finally:
        conn.close()


def delete_chunks_for_document(document_id: str) -> None:
    conn = connect()
    try:
        with write_txn(conn):
            conn.execute(
                "DELETE FROM chunks_fts WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id=?)",
                (document_id,),
            )
            conn.execute(
                "DELETE FROM embeddings WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id=?)",
                (document_id,),
            )
            conn.execute("DELETE FROM chunks WHERE document_id=?", (document_id,))
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Search
# --------------------------------------------------------------------------- #

def _cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b:
        return 0.0
    if len(a) == len(b):
        # sumprod runs at C speed -- ~12x faster than an interpreted loop over
        # embedding dimensions, which dominates review latency at scale.
        na = _sumprod(a, a)
        nb = _sumprod(b, b)
        if na == 0.0 or nb == 0.0:
            return 0.0
        return _sumprod(a, b) / math.sqrt(na * nb)
    # Dimension mismatch (should not occur with the model filter): keep the
    # historical zip-truncating behaviour instead of raising.
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / math.sqrt(na * nb)


def _fts_query(text: str) -> str | None:
    r"""FTS5 MATCH expression for the query, or None when it has no usable tokens.

    Tokens are `\w` runs only, so nothing in the expression can break FTS5
    syntax. The old fallback wrapped raw text -- including quotes -- in a
    quoted phrase and could raise a query-time syntax error.
    """
    toks = _FTS_TOKEN.findall(text)[:32]
    if not toks:
        return None
    return " OR ".join('"%s"' % t for t in toks)


def search_many(
    company_id: str,
    requests: Sequence[tuple[str, Sequence[float], Sequence[str] | None, int]],
    *,
    statuses: Sequence[str] | None = ("active",),
) -> list[list[dict]]:
    """Score several queries against one company in a single pass.

    `requests` is a list of (query, query_vector, doc_types, top_k). The
    company's chunks and vectors are read from SQLite exactly once and reused
    by every request; a review plan used to re-read the whole corpus once per
    query (up to ~28 full scans per review).

    Isolation is enforced here: only `company_id`'s rows are ever loaded, and
    the keyword index is pruned to that company as well. Scoring per request
    is identical to a standalone search: the candidate set, bm25 values and
    normalization range are computed per request, so results match one query
    at a time.
    """
    if not requests:
        return []
    out: list[list[dict]] = [[] for _ in requests]

    where = ["c.company_id = ?"]
    params: list = [company_id]
    if statuses:
        where.append("d.status IN (%s)" % ",".join("?" * len(statuses)))
        params.extend(statuses)
    sql = (
        "SELECT c.id AS chunk_id, c.text, c.section, c.page, d.id AS document_id,"
        " d.title, d.doc_type, d.version, d.status, d.effective_date, d.meta_json"
        " FROM chunks c JOIN documents d ON d.id = c.document_id"
        " WHERE " + " AND ".join(where)
    )

    conn = connect()
    try:
        rows = [dict(r) for r in conn.execute(sql, params)]
        if not rows:
            return out

        # Vectors for the current model only, fetched in parameter-safe batches.
        cid2vec: dict[str, list[float]] = {}
        cids = [r["chunk_id"] for r in rows]
        model = _current_model()
        for i in range(0, len(cids), 900):
            batch = cids[i : i + 900]
            ph = ",".join("?" * len(batch))
            for row in conn.execute(
                "SELECT chunk_id, vector FROM embeddings WHERE model=? AND chunk_id IN (%s)" % ph,
                [model, *batch],
            ):
                cid2vec[row["chunk_id"]] = unpack_vector(row["vector"])

        for i, (query, qvec, doc_types, k) in enumerate(requests):
            if doc_types:
                keep = set(doc_types)
                cands = [dict(r) for r in rows if r["doc_type"] in keep]
            else:
                cands = [dict(r) for r in rows]
            if not cands:
                continue

            for c in cands:
                c["semantic_score"] = _cosine(qvec, cid2vec.get(c["chunk_id"], []))

            # keyword evidence via FTS5 (bm25 is lower=better; normalize 0..1).
            # Pruned to this company; bm25 is row-local, so pruning never
            # changes the values for surviving rows.
            kw: dict[str, float] = {}
            fts = _fts_query(query)
            if fts is not None:
                for r in conn.execute(
                    "SELECT chunk_id, bm25(chunks_fts) AS b FROM chunks_fts"
                    " WHERE chunks_fts MATCH ?"
                    " AND chunk_id IN (SELECT id FROM chunks WHERE company_id=?)",
                    (fts, company_id),
                ):
                    kw[r["chunk_id"]] = r["b"]

            cands_kw = [kw[c["chunk_id"]] for c in cands if c["chunk_id"] in kw]
            if cands_kw:
                worst, best = max(cands_kw), min(cands_kw)
                span = max(1e-9, worst - best)
                for c in cands:
                    b = kw.get(c["chunk_id"])
                    c["keyword_score"] = (worst - b) / span if b is not None else 0.0
            else:
                for c in cands:
                    c["keyword_score"] = 0.0

            w_sem, w_kw = 0.75, 0.25
            for c in cands:
                c["score"] = w_sem * c["semantic_score"] + w_kw * c["keyword_score"]
            cands.sort(key=lambda c: c["score"], reverse=True)
            out[i] = cands[:k]
    finally:
        conn.close()
    return out


def search_hybrid(
    company_id: str,
    query: str,
    *,
    top_k: int | None = None,
    doc_types: Sequence[str] | None = None,
    statuses: Sequence[str] | None = ("active",),
    qvec: Sequence[float] | None = None,
) -> list[dict]:
    """Retrieve top_k chunks (dicts) for one company. Isolation is enforced here.

    Each result includes chunk + document metadata honestly labelled per row:
      semantic_score, keyword_score, and blended `score`.
    Pass `qvec` to skip re-embedding an already-computed query vector.
    """
    k = top_k or settings.retrieval_top_k
    if qvec is None:
        qvec = embed_texts_any([query])[0]
    return search_many(
        company_id,
        [(query, qvec, list(doc_types) if doc_types else None, k)],
        statuses=statuses,
    )[0]
