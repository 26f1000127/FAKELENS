# Spyglass — Brand Governance RAG Backend

An AI-powered brand-governance / compliance review backend. Companies upload
official documents (brand guidelines, policies, specs, approved claims, …) into
a per-company knowledge base; then any submitted article / announcement / post
is reviewed against that knowledge base with retrieval-augmented evidence
checks: factual accuracy, policy compliance, contradictions, brand voice,
unsupported claims, and missing disclosures.

## Quick start (offline demo mode — no API keys needed)

```bash
python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env    # optional; defaults already point at sqlite://./data/spyglass.db
.venv/bin/uvicorn spyglass.main:app --reload --port 8100
```

With no `GEMINI_API_KEY` (or compatible-provider `OPENAI_API_KEY`) the service runs in **offline mode**: a deterministic
hashing embedder + a transparent rule-based reviewer (labelled
`"reviewer": "offline_rules"` in every result). It exercises the whole pipeline
but uses no network.

## Real LLM mode (Gemini 4 Argon)

Set in `.env`:

```bash
GEMINI_API_KEY=...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
CHAT_MODEL=gemini-4-argon
EMBEDDING_MODEL=gemini-embedding-001
```

The backend uses Gemini's OpenAI-compatible REST interface, so no client-code
change is required. `OPENAI_API_KEY` and `OPENAI_BASE_URL` remain supported for
an intentionally selected compatible gateway (LiteLLM, vLLM, Azure proxy, etc.).

**Chat vs embeddings routes:** Gemini's OpenAI-compatible layer serves
`POST …/openai/chat/completions` for the Argon evaluation, but it has **no**
`…/openai/embeddings` route (it answers 404). Embeddings therefore go through
Gemini's native `POST /v1beta/models/gemini-embedding-001:batchEmbedContents`
with `x-goog-api-key` auth; `spyglass/llm.py` picks the right route
automatically from `OPENAI_BASE_URL` (OpenAI-compatible providers keep the
standard `/embeddings` path).

The evaluation prompt + JSON schema (`spyglass/review.py: build_prompt`) force
the model to cite retrieved chunk ids and forbid invented evidence; the
pipeline then validates the model output (quotes must exist in the submitted
content, citations must map to retrieved chunks, severity is rule-clamped from
category × verification, unverifiable ≠ false).

## API surface (all requests need `X-API-Key` header)

| Endpoint | Purpose |
|---|---|
| `POST /companies` `{name}` | create a tenant |
| `GET /companies` | list tenants |
| `POST /companies/{cid}/documents` | ingest PDF/DOCX/TXT/MD (`doc_type` + optional `title`, `effective_date`; multipart) |
| `GET /companies/{cid}/documents` / `…/{doc_id}` | list / inspect documents |
| `DELETE /companies/{cid}/documents/{doc_id}?mode=retire\|hard` | soft-retire or hard-delete |
| `POST /companies/{cid}/reviews` `{title?, content}` | submit content; returns the full review payload |
| `GET /companies/{cid}/reviews` / `…/{review_id}` | list / read reviews |

`doc_type` ∈ brand_guideline · policy · product_spec · approved_claims ·
publication · legal · terminology · fact_sheet · announcement · press_release.

## Review output schema (per draft)

```json
{
  "review_id": "rev_xxx", "company_id": "cmp_xxx",
  "status": "completed",
  "overall_status": "PASS | NEEDS_REVIEW | BLOCKED",
  "summary": "…", "severity_counts": {"critical": 0, "high": 0, …},
  "findings": [
    {
      "id": "fnd_xxx", "category": "policy_compliance", "severity": "critical",
      "quote": "<verbatim span from the article>",
      "explanation": "…",
      "evidence": [{"chunk_id": "chk_xxx", "document_id": "…", "document_title": "…",
                    "section": "…", "page": 3, "doc_type": "policy",
                    "citation": "Doc § section (p. 3)", "text": "…", "match_score": 0.71}],
      "suggestion": "…", "confidence": 0.83,
      "verification": "verified | uncertain | needs_human_review"
    }
  ],
  "unverified_claims": [{"quote": "…", "explanation": "could not be verified…"}],
  "areas_for_human_review": ["…"],
  "evidence": [ …all retrieved chunks with citations… ]
}
```

Governance invariants enforced in code (`spyglass/review.py`):

1. **Evidence-only findings** — every finding cites a retrieved chunk; missing
   citations downgrade the item to an unverified claim.
2. **Quote fidelity** — a finding’s quote must occur in the submitted content,
   otherwise it is dropped as a hallucination.
3. **Unverifiable ≠ false** — claims the KB neither confirms nor refutes land
   in `unverified_claims`, never as severity findings.
4. **Rule-based severity clamp** — `_BASE_SEVERITY` maps category ×
   verification to a severity band the model can only refine, never escalate.
5. **Company isolation** — `search_hybrid(company_id, …)` always filters by the
   tenant; other companies’ documents can never be retrieved.

## Retrieval

- Parsing keeps structure: heading breadcrumbs, PDF page numbers, DOCX heading
  styles and tables, Markdown heading hierarchy.
- Chunking (`spyglass/chunking.py`) packs blocks up to a char budget without
  crossing headings or pages; oversized blocks split on paragraphs / sentences
  with overlap.
- Hybrid search: cosine similarity (`embeddings`, float32 blobs) blended with
  FTS5 (BM25) keyword scores; `status='active'` filter only, so superseded or
  retired documents never feed retrieval.
- Each review builds a category-focused retrieval plan (fact-check lines,
  brand-voice, policy, contradiction scan) and dedupes the collected evidence.

## Versioning / replacement

Re-ingesting a document with the same title but new content supersedes the old
version (status `superseded`, chunks removed from the index immediately — no
obsolete chunks can ever surface). Byte-identical re-uploads are detected by
SHA-256 and ignored as duplicates. `DELETE ?mode=retire` soft-retires,
`mode=hard` erases the row, chunks and file.

## Tests

```bash
.venv/bin/python -m pytest tests -q
```

Covers: end-to-end review (prohibited-phrase/brand finding + unverified
numeric claims), cross-company isolation, duplicate detection, replacement
versioning, retirement, heading-preserving chunking, DOCX parsing, API-key
authorization, plus Gemini wiring (native batch-embed request shape and the
chat-400 minimal-payload retry) — all network-free via a stubbed httpx client.

## Notes

- SQLite + WAL is the default store; `DATABASE_URL` is only extended to
  `sqlite://` paths by design of this phase (swap `spyglass/db.py` + the
  vector blob storage for Postgres/pgvector in production later).
- Start uvicorn via the path shown above; OpenAPI docs at `/docs`.
