"""SQLite persistence layer: schema, connection helpers and small struct helpers.

One database file holds:
  - relational tables (companies, documents, chunks, reviews, review_findings)
  - an FTS5 keyword index over chunk text (hybrid retrieval)
  - per-chunk embedding vectors stored as float32 blobs
"""
from __future__ import annotations

import json
import sqlite3
import struct
import threading
import uuid
from contextlib import contextmanager
from typing import Any, Iterable, Iterator

from spyglass.config import settings

# Lock for the tiny set of mutating operations that sqlite3 cannot safely run
# in parallel across many threads with a plain connection-per-call policy.
_WRITE_LOCK = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',       -- active | superseded | retired
    effective_date TEXT,                          -- ISO date, optional
    expires_date TEXT,                            -- ISO date, optional
    filename TEXT,
    storage_path TEXT,                            -- original upload path
    file_hash TEXT NOT NULL,                      -- sha256 of raw bytes; duplicate detection
    meta_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    superseded_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id, status);

CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    section TEXT,                                  -- heading breadcrumb, e.g. '2. Pricing > Refunds'
    page INTEGER,                                  -- 1-based, when the source is paginated
    char_start INTEGER, char_end INTEGER,          -- offsets into the extracted clean text
    meta_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_company ON chunks(company_id);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    chunk_id UNINDEXED, text
);

CREATE TABLE IF NOT EXISTS embeddings (
    chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    dim INTEGER NOT NULL,
    vector BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    status TEXT NOT NULL,                          -- queued | running | completed | failed
    content_title TEXT,
    content_text TEXT NOT NULL,
    overall_status TEXT,                           -- PASS | NEEDS_REVIEW | BLOCKED (set on completion)
    summary TEXT,
    result_json TEXT,                              -- full structured result (findings, evidence, etc.)
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS review_findings (
    id TEXT PRIMARY KEY,                           -- finding id (fnd_xxx)
    review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,                        -- critical | high | medium | low | informational
    quote TEXT NOT NULL,                           -- exact span from the submitted content
    explanation TEXT NOT NULL,
    evidence_json TEXT NOT NULL DEFAULT '[]',
    citation TEXT,                                 -- 'Document title § section (p. N)'
    suggestion TEXT,
    confidence REAL,                               -- 0..1
    verification TEXT NOT NULL                     -- verified | uncertain | needs_human_review
);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_findings_review ON review_findings(review_id);
"""


def connect(db_path: str | None = None) -> sqlite3.Connection:
    """Open a connection with sane pragmas. Caller owns the connection."""
    path = db_path or str(settings.db_path)
    # check_same_thread=False: every call below runs one short statement and
    # writes are serialized with _WRITE_LOCK, so this is safe in FastAPI threads.
    conn = sqlite3.connect(path, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


@contextmanager
def write_txn(conn: sqlite3.Connection | None = None) -> Iterator[sqlite3.Connection]:
    """Serialize writes app-wide so multi-threaded FastAPI writers don't contend."""
    own = None
    if conn is None:
        own = connect()
        conn = own
    with _WRITE_LOCK:
        try:
            with conn:
                yield conn
        finally:
            if own is not None:
                own.close()


def init_schema() -> None:
    conn = connect()
    try:
        with write_txn(conn):
            conn.executescript(SCHEMA)
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Vector (de)serialization helpers
# --------------------------------------------------------------------------- #

def pack_vector(vec: Iterable[float]) -> bytes:
    return struct.pack("<%df" % len(vec), *[float(x) for x in vec])


def unpack_vector(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack("<%df" % n, blob))


def dump_json(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def load_json(raw: str | None, default: Any = None) -> Any:
    if raw is None or raw == "":
        return default
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return default


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"
