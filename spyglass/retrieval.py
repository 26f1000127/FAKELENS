"""Retrieval strategy for content review.

The reviewer needs different slices of the knowledge base depending on what it
is about to evaluate, so each category maps to a focused retrieval plan (query
text + document types). Later steps iterate the plan, collect unique chunks and
pass them to the LLM with full citation metadata.

Policy is strict about what counts as "current authority":
  - only documents with status == 'active' are used (superseded ones never feed
    findings), and
  - doc_types are pinned per category so, e.g., factual checks pull product
    specs and approved claims, never informal content.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from spyglass.llm import embed_texts_any
from spyglass.vectorstore import search_many


@dataclass
class RetrievalPlanItem:
    category: str
    query: str
    doc_types: Iterable[str]
    top_k: int = 8


def build_plan(title: str, content: str) -> list["RetrievalPlanItem"]:
    """Split submitted content into semantic pieces and plan focused queries.

    Deterministic, lexical piece selection: the title, the first paragraph
    (framing/summary), and the lines richest in verifiable details (numbers,
    dates, names, product mentions, strongest claim-language). This mirrors how
    the prompt then groups evidence per claim instead of one blind mega-query.
    """
    queries: list[RetrievalPlanItem] = []
    add = queries.append

    # Framing / overall-stance query (what the content is about).
    add(
        RetrievalPlanItem(
            category="context",
            query=f"{title}\n{(content or '').strip()[:600]}",
            doc_types=["brand_guideline", "fact_sheet", "policy", "product_spec", "approved_claims", "publication", "legal"],
        )
    )
    # Whole-content query for brand-voice/terminology rules.
    add(
        RetrievalPlanItem(
            category="brand_voice",
            query=(content or "")[:4000],
            doc_types=["brand_guideline", "terminology"],
        )
    )
    # Whole-content query for policy rules the content might conflict with.
    add(
        RetrievalPlanItem(
            category="policy",
            query=(content or "")[:4000],
            doc_types=["policy", "legal"],
        )
    )
    # Verifiable-detail-rich lines -> likely factual claims.
    for line in _claim_lines(content):
        add(
            RetrievalPlanItem(
                category="factual",
                query=line[:1200],
                doc_types=["fact_sheet", "product_spec", "approved_claims", "publication", "data_book"],
            )
        )
    # Contradiction scan: match against previously approved publications.
    add(
        RetrievalPlanItem(
            category="contradiction",
            query=f"{title}\n{content or ''}"[:4000],
            doc_types=["publication", "announcement", "press_release", "product_spec"],
        )
    )
    return queries


_CLAIM_WORDS = re.compile(
    r"(\d+(\.\d+)?%?|\b\w+\b.*\b(guarantee|refund|certif|free|fastest|leading|"
    r"first|only|never|always|24/7|hours?|days?|years?|percent|up to)\b)",
    re.IGNORECASE,
)


def _claim_lines(content: str, max_lines: int = 24) -> list[str]:
    """Pick the sentences most likely to contain verifiable company claims.

    Scores lines by: presence of numbers & percentages, superlative/promise
    vocabulary, product nouns, and sentence length banding. Deterministic; no
    model call at this stage.
    """
    if not content:
        return []
    sentences: list[str] = []
    for para in _RE_SPLIT.split(content):
        for s in re.split(r"(?<=[.!?])\s+", para.strip()):
            s = s.strip()
            if 20 <= len(s) <= 600:
                sentences.append(s)
    scored: list[tuple[float, str]] = []
    for s in sentences:
        score = 0.0
        if re.search(r"\d", s):
            score += 3.0
        if "%" in s or "$" in s or "€" in s:
            score += 2.0
        for m in re.finditer(r"\b(guarantee|fastest|first|only|never|always|leading|best|new)", s, re.IGNORECASE):
            score += 1.5
        for m in re.finditer(r"\b[A-Z][a-z]+\s?(?:Pro|Plus|X|One|Two|Go)\b", s):
            score += 1.0
        if s.count(" ") > 10:
            score += 0.5
        scored.append((score, s))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [s for score, s in scored if score > 0][:max_lines]


_RE_SPLIT = re.compile(r"\n\s*\n")


def collect_evidence(company_id: str, plan: list["RetrievalPlanItem"]) -> list[dict]:
    """Run the plan and return unique, deduplicated chunk rows with metadata."""
    if not plan:
        return []
    seen: dict[str, dict] = {}

    # Materialize (query, doc_types, top_k) per plan item, then embed every
    # distinct query text in ONE batched call: online mode used to make one
    # network round-trip per query (a review plan has up to ~28 queries).
    specs = [(item.query, tuple(item.doc_types), item.top_k) for item in plan]
    unique_texts = list(dict.fromkeys(q for q, _, _ in specs))
    vectors = dict(zip(unique_texts, embed_texts_any(unique_texts)))

    # One corpus read for the whole plan; per-request scoring happens inside.
    results = search_many(
        company_id,
        [(q, vectors[q], list(dt), k) for q, dt, k in specs],
    )

    for item, hits in zip(plan, results):
        for h in hits:
            h = dict(h)
            h["matched_category"] = item.category
            if h["chunk_id"] in seen:
                # Merge matched categories rather than duplicating rows.
                seen[h["chunk_id"]].setdefault("matched_categories", []).append(h["matched_category"])
            else:
                h["matched_categories"] = [h["matched_category"]]
                seen[h["chunk_id"]] = h
    out = sorted(seen.values(), key=lambda r: r["score"], reverse=True)
    top_k = 20  # cap aggregate evidence to keep prompts bounded
    return out[:top_k]

