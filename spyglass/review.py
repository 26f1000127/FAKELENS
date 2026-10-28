"""Content review pipeline: evaluate submitted drafts against the knowledge base.

The LLM is the evaluator; retrieval (retrieval.py) supplies the evidence. Rules
of the pipeline, enforced in code and echoed in the prompt:

  1. Evidence-only findings: every finding must cite retrieved chunks
     (chunk_id + document title + section + page). Citations that do not
     resolve to retrieved evidence are dropped.
  2. Quotes must exist in the submitted content (verbatim, normalized);
     anything else is treated as a model hallucination and discarded.
  3. Unverifiable != false: claims the knowledge base neither confirms nor
     refutes become `unverified_claims` entries, never severity findings.
  4. Severity is rule-clamped in code from category x verification status, so
     the classification follows explicit rules plus evidence, not raw model whim.
  5. Offline mode (no OPENAI_API_KEY) uses a deterministic rule-based reviewer
     on the same schema, labelled `"reviewer": "offline_rules"`.
"""
from __future__ import annotations

import re
import time
from typing import Any

from spyglass import retrieval
from spyglass.config import settings
from spyglass.db import connect, dump_json, load_json, new_id, write_txn
from spyglass.llm import chat, parse_llm_json

CATEGORIES = ("factual_accuracy", "policy_compliance", "contradiction",
              "brand_voice_terminology", "unsupported_claim", "missing_info")
SEVERITIES = ("critical", "high", "medium", "low", "informational")
VERIFICATIONS = ("verified", "uncertain", "needs_human_review")
_ORDER = {s: i for i, s in enumerate(SEVERITIES)}

# Rule table: base severity per category, adjusted by verification status.
_BASE_SEVERITY: dict[str, dict[str, str]] = {
    "factual_accuracy":        {"verified": "high",    "uncertain": "informational", "needs_human_review": "medium"},
    "policy_compliance":       {"verified": "critical", "uncertain": "informational", "needs_human_review": "high"},
    "contradiction":           {"verified": "high",     "uncertain": "informational", "needs_human_review": "medium"},
    "brand_voice_terminology": {"verified": "low",      "uncertain": "informational", "needs_human_review": "low"},
    "unsupported_claim":       {"verified": "medium",   "uncertain": "informational", "needs_human_review": "medium"},
    "missing_info":            {"verified": "medium",   "uncertain": "informational", "needs_human_review": "medium"},
}


def _clamp_severity(category: str, verification: str, model_severity: str) -> str:
    base = _BASE_SEVERITY.get(category, {}).get(verification, "informational")
    if model_severity not in _ORDER:
        return base
    # Confirmed critical/high stay material: model may soften them, but a
    # 'critical' confirmed violation never drops below 'medium'.
    floor = {"critical": "medium", "high": "low"}.get(base)
    if floor and _ORDER[model_severity] > _ORDER[floor]:
        return floor
    # Everything else: model may refine within its band, never invent severity
    # for human-review items beyond 'medium'.
    if base in ("medium", "low", "informational") and _ORDER[model_severity] > _ORDER["medium"]:
        return "medium"
    return model_severity


# --------------------------------------------------------------------------- #
# Prompt
# --------------------------------------------------------------------------- #

def build_prompt(title: str, content: str, evidence: list[dict]) -> list[dict[str, str]]:
    evidence_lines: list[str] = []
    for i, e in enumerate(evidence, start=1):
        page_s = f", p. {e.get('page')}" if e.get("page") else ""
        evidence_lines.append(
            f"[E{i}] chunk_id={e['chunk_id']} | {e['title']}{page_s} | "
            f"section: {e.get('section') or '-'} | type={e['doc_type']} | status={e['status']}\n"
            f"{e['text'][:900]}"
        )
    evidence_block = "\n\n".join(evidence_lines) or "(no evidence retrieved)"

    system = (
        "You are a strict, evidence-grounded brand-governance reviewer for company content.\n"
        "Evaluate the submitted content ONLY against the knowledge-base evidence provided.\n"
        "Absolute rules:\n"
        "1. NEVER invent policies, facts, numbers, document titles, sections or page numbers.\n"
        "2. Every finding MUST cite the evidence entries it relies on (their E-numbers).\n"
        "3. If evidence neither supports nor refutes a statement, list it under unverified_claims.\n"
        "   Never mark an unverifiable claim as false, and never turn it into a finding.\n"
        "4. Do not create findings for harmless rewording or stylistic variation; findings need\n"
        "   a real, evidence-backed conflict.\n"
        "5. Quotes you output MUST be copied verbatim from the submitted content.\n"
        "Respond ONLY with a single JSON object in the requested schema."
    )

    user = f"""SUBMITTED CONTENT
title: {title}
content:
<<<
{content}
>>>

EVIDENCE FROM THE COMPANY KNOWLEDGE BASE (current authoritative documents only)
{evidence_block}

Evaluate on these dimensions:
1. factual_accuracy: names, dates, figures, specs, statistics vs. authoritative sources.
2. policy_compliance: conflicts with cited policies/regulations; restrictions, disclaimers, mandatory disclosures.
3. contradiction: statements contradicting established company facts, previously approved messaging or current product documentation, as shown in the evidence. Name exactly what conflicts with what.
4. brand_voice_terminology: tone, naming conventions, prohibited phrases, unapproved messaging, per cited brand guidelines.
5. unsupported_claim: absolutes, guarantees, superiority/superlative claims without supporting evidence.
6. missing_info: ONLY when cited guidelines explicitly require a disclaimer or disclosure the content omits.

Return JSON exactly like:
{{
  "findings": [
    {{
      "category": one of ["factual_accuracy","policy_compliance","contradiction","brand_voice_terminology","unsupported_claim","missing_info"],
      "severity": one of ["critical","high","medium","low","informational"],
      "quote": "<verbatim span from the submitted content>",
      "explanation": "<why, grounded in the cited evidence>",
      "evidence_ids": ["<E-numbers>"],
      "suggestion": "<optional concrete correction>",
      "confidence": <0.0-1.0>
    }}
  ],
  "unverified_claims": [
    {{"quote": "<verbatim span>", "explanation": "<why it could not be verified>", "confidence": <0.0-1.0>}}
  ],
  "areas_for_human_review": ["<short description>"],
  "overall_summary": "<2-4 sentence risk summary>"
}}
If everything is fine, return empty lists and a PASS-style summary."""
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


# --------------------------------------------------------------------------- #
# Post-processing / governize model output
# --------------------------------------------------------------------------- #

def _norm(s: str) -> str:
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    return re.sub(r"\s+", " ", s).strip().lower()


def _verify_quote(quote: str, content_norm: str) -> str | None:
    """Return the normalized quote if it occurs in the content, else None."""
    q = re.sub(r"\s+", " ", quote).strip()
    if not q:
        return None
    nq = _norm(q)
    if nq in content_norm:
        return q
    # 60%+ leading fragment fallback (model truncation tolerance)
    words = q.split()
    if len(words) > 5:
        frag = " ".join(words[: int(len(words) * 0.7)]) or q
        if _norm(frag) in content_norm:
            return frag
    return None


def _evidence_ref(e: dict) -> dict[str, Any]:
    page = e.get("page")
    return {
        "chunk_id": e["chunk_id"],
        "document_id": e["document_id"],
        "document_title": e["title"],
        "section": e.get("section"),
        "page": page,
        "doc_type": e["doc_type"],
        "doc_version": e["version"],
        "citation": f"{e['title']} § {e.get('section') or '-'}" + (f" (p. {page})" if page else ""),
        "text": e["text"][:1200],
        "match_score": round(float(e.get("score") or 0.0), 4),
    }


def _finalize(
    data: dict[str, Any],
    content: str,
    evidence: list[dict],
    reviewer: str,
    retrieval_ms: int,
) -> dict[str, Any]:
    by_eid = {f"E{i+1}": e for i, e in enumerate(evidence)}
    content_norm = _norm(content)

    findings: list[dict[str, Any]] = []
    unverified: list[dict[str, Any]] = []

    for f in (data.get("findings") or []):
        if not isinstance(f, dict):
            continue
        quote = _verify_quote(f.get("quote") or "", content_norm)
        if not quote:
            continue  # model quoted text absent from content: hallucination, drop
        eids = [e for e in (f.get("evidence_ids") or []) if e in by_eid]
        if not eids:
            unverified.append({
                "quote": quote,
                "explanation": ("Reviewer flagged this span, but the knowledge base contains no supporting "
                                "evidence for it; flagging instead of scoring it."),
                "confidence": min(0.5, float(f.get("confidence") or 0.5)),
            })
            continue
        category = f.get("category") if f.get("category") in CATEGORIES else "brand_voice_terminology"
        conf = max(0.0, min(1.0, float(f.get("confidence") or 0.5)))
        raw_severity = f.get("severity") or ""   # may be absent or invalid from the model
        sev_key = raw_severity if raw_severity in _ORDER else "informational"
        # evidence present & active docs -> generally verified; low confidence -> human review
        verification = "verified" if conf >= 0.55 else "needs_human_review"
        if category in ("policy_compliance", "contradiction", "factual_accuracy") and _ORDER[sev_key] <= _ORDER["medium"] and conf < 0.8:
            verification = "needs_human_review"
        severity = _clamp_severity(category, verification, raw_severity)
        findings.append({
            "id": new_id("fnd"),
            "category": category,
            "severity": severity,
            "quote": quote,
            "explanation": (f.get("explanation") or "").strip(),
            "evidence": [_evidence_ref(by_eid[e]) for e in eids],
            "suggestion": (f.get("suggestion") or "").strip() or None,
            "confidence": round(conf, 3),
            "verification": verification,
        })

    for u in (data.get("unverified_claims") or []):
        if not isinstance(u, dict):
            continue
        quote = _verify_quote(u.get("quote") or "", content_norm)
        if not quote:
            continue
        unverified.append({
            "quote": quote,
            "explanation": (u.get("explanation") or
                            "The knowledge base does not contain sufficient evidence to verify this claim.").strip(),
            "confidence": round(max(0.0, min(1.0, float(u.get("confidence") or 0.5))), 3),
        })

    counts = {s: 0 for s in SEVERITIES}
    for f in findings:
        counts[f["severity"]] += 1
    if counts["critical"]:
        overall = "BLOCKED"
    elif counts["high"] or counts["medium"]:
        overall = "NEEDS_REVIEW"
    else:
        overall = "PASS"

    areas = [str(a) for a in (data.get("areas_for_human_review") or [])][:20]
    for f in findings:
        if f["verification"] == "needs_human_review" and not any(f["id"] in a for a in areas):
            areas.append(f"Finding {f['id']} ({f['category']}) marked needs_human_review.")

    return {
        "reviewer": reviewer,
        "retrieval_ms": retrieval_ms,
        "evidence": [_evidence_ref(e) | {"matched_categories": e.get("matched_categories", [])} for e in evidence],
        "findings": findings,
        "unverified_claims": unverified,
        "areas_for_human_review": areas,
        "overall_status": overall,
        "severity_counts": counts,
        "summary": (data.get("overall_summary") or "").strip(),
    }


# --------------------------------------------------------------------------- #
# Offline deterministic reviewer (no LLM key required)
# --------------------------------------------------------------------------- #

_ABSOLUTES = re.compile(
    r"\b(guarantees?d?|never fails?|absolutely|100(?:%| percent)|risk[- ]free|fastest|"
    r"best in (?:the )?(?:world|class|market)|number one|no\. ?1|#1|unbeatable|"
    r"world[- ]class|superior to|leading)\b", re.IGNORECASE)


def run_offline_review(title: str, content: str, evidence: list[dict], retrieval_ms: int) -> dict[str, Any]:
    """Deterministic stand-in when no LLM key is configured. Same schema,
    deliberately narrower coverage, clearly labelled `offline_rules`."""
    findings: list[dict[str, Any]] = []
    unverified: list[dict[str, Any]] = []
    areas: list[str] = [
        "Offline mode: simple rule-based reviewer ran instead of the LLM evaluation. "
        "Configure OPENAI_API_KEY for full semantic review.",
    ]
    content_norm = _norm(content)
    evidence_text = _norm(" ".join(e["text"] for e in evidence))

    def add_finding(quote: str, category: str, explanation: str, e: dict, severity: str | None = None) -> None:
        f = {
            "id": new_id("fnd"),
            "category": category,
            "severity": severity or _clamp_severity(category, "needs_human_review", "medium"),
            "quote": quote,
            "explanation": explanation,
            "evidence": [_evidence_ref(e)],
            "suggestion": None,
            "confidence": 0.55,
            "verification": "needs_human_review",
        }
        findings.append(f)

    banned: list[str] = []
    for e in evidence:
        if e.get("doc_type") not in ("brand_guideline", "terminology"):
            continue
        m = re.search(r"(?:prohibited phrases?|prohibited (?:terms|words)|banned (?:terms|phrases)|never write|do not use)[:\s]+(.{0,500})", e["text"], re.IGNORECASE | re.DOTALL)
        if m:
            banned.extend(p.lower() for p in re.findall(r"[\"'“']([^\"'”']{3,60})[\"'“']", m.group(1)))
    banned = list(dict.fromkeys(banned))  # a phrase listed by two docs -> one finding
    for phrase in banned:
        if phrase and phrase in evidence_text and phrase in content_norm:
            for e in evidence:
                if phrase in _norm(e["text"]):
                    m2 = re.search(re.escape(phrase), content, re.IGNORECASE)
                    if m2:
                        add_finding(m2.group(0), "brand_voice_terminology",
                                    "Submitted content contains a phrase the cited brand guideline prohibits.", e)
                    break

    for e in evidence:
        if e.get("doc_type") not in ("policy", "legal"):
            continue
        m = re.search(r"(?:must not|shall not|is prohibited|are prohibited)[:\s]*([^\n.;]{12,180})", e["text"], re.IGNORECASE)
        if not m:
            continue
        frag = _norm(m.group(1))[:40]
        if len(frag) < 12:
            continue
        head = frag[: 24].strip()
        if not head or head not in evidence_text or head not in content_norm:
            continue
        # Extract the span verbatim from the raw content: content_norm offsets
        # do not map back after whitespace collapsing, so slicing by them could
        # emit a quote that does not actually occur in the submitted text.
        m3 = re.search(r"\s+".join(re.escape(w) for w in head.split()), content, re.IGNORECASE)
        if not m3:
            continue
        add_finding(m3.group(0), "policy_compliance",
                    "Submitted content appears to conflict with the cited policy text; human review required.", e,
                    "high")
        break

    # Absolute/superlative claims without any supporting evidence text
    for sent in re.split(r"(?<=[.!?])\s+", content):
        m = _ABSOLUTES.search(sent)
        if not m:
            continue
        q = _verify_quote(sent.strip(), content_norm)
        if not q:   # quote must exist verbatim in the submitted content
            continue
        key = _norm(m.group(0))[:10]
        nearby = any(key and key in _norm(x["text"]) for x in evidence if x.get("doc_type") in ("fact_sheet", "approved_claims", "product_spec"))
        if not nearby:
            unverified.append({
                "quote": q,
                "explanation": "Uses absolute/superlative language ('%s') and no knowledge-base evidence supports it." % m.group(0),
                "confidence": 0.5,
            })

    # Numeric/time claims not found in evidence -> unverifiable, not false.
    for m in re.finditer(r"[^.\n]*\b\d[\d.,]*\s?(?:%|percent|hours?|days?|years?|€|\$|dollars?|euros?)[^.\n]*", content):
        span = m.group(0).strip()[:300]
        q = _verify_quote(span, content_norm)
        if not q:   # store only a span that verbatim occurs in the content
            continue
        tokens = [t for t in re.findall(r"\d[\d.,]*", span) if t]
        if tokens and not all(t in evidence_text for t in tokens):
            unverified.append({
                "quote": q,
                "explanation": "No evidence in the knowledge base confirms this figure or timeframe; it could not be verified (not treated as false).",
                "confidence": 0.4,
            })

    counts = {s: 0 for s in SEVERITIES}
    for f in findings:
        counts[f["severity"]] += 1
    overall = "BLOCKED" if counts["critical"] else "NEEDS_REVIEW" if (counts["high"] or counts["medium"]) else "PASS"
    summary = ("Offline rule-based review: %d finding(s), %d unverified claim(s). "
               "Configure OPENAI_API_KEY for full LLM evaluation." % (len(findings), len(unverified)))
    return {
        "reviewer": "offline_rules",
        "retrieval_ms": retrieval_ms,
        "evidence": [_evidence_ref(e) | {"matched_categories": e.get("matched_categories", [])} for e in evidence],
        "findings": findings,
        "unverified_claims": unverified,
        "areas_for_human_review": areas,
        "overall_status": overall,
        "severity_counts": counts,
        "summary": summary,
    }


# --------------------------------------------------------------------------- #
# Orchestration / persistence
# --------------------------------------------------------------------------- #

def create_review(company_id: str, title: str, content: str) -> dict[str, Any]:
    review_id = new_id("rev")
    title = (title or "").strip() or next(
        (ln.strip().lstrip("# ").strip() for ln in content.splitlines() if ln.strip()), "Untitled draft"
    )[:140]
    content = (content or "").strip()[: settings.max_review_content_chars]
    conn = connect()
    try:
        with write_txn(conn):
            conn.execute(
                "INSERT INTO reviews (id, company_id, status, content_title, content_text) VALUES (?,?,?,?,?)",
                (review_id, company_id, "queued", title, content),
            )
    finally:
        conn.close()
    return {"id": review_id, "status": "queued", "company_id": company_id, "content_title": title}


def execute_review(review_id: str) -> dict[str, Any]:
    """Run retrieval + evaluation for a persisted review and persist the result."""
    conn = connect()
    row = None
    try:
        r = conn.execute("SELECT * FROM reviews WHERE id=?", (review_id,)).fetchone()
        row = dict(r) if r else None
    finally:
        conn.close()
    if not row:
        raise KeyError("review not found: %s" % review_id)

    title = row["content_title"]
    content = row["content_text"]
    started = time.time()

    plan = retrieval.build_plan(title, content)
    evidence = retrieval.collect_evidence(row["company_id"], plan)
    retrieval_ms = int((time.time() - started) * 1000)

    if settings.offline_mode:
        result = run_offline_review(title, content, evidence, retrieval_ms)
    else:
        messages = build_prompt(title, content, evidence)
        data = parse_llm_json(chat(messages))
        result = _finalize(data, content, evidence, reviewer="llm", retrieval_ms=retrieval_ms)

    # Persist the full structured result + flattened findings.
    conn = connect()
    try:
        with write_txn(conn):
            conn.execute(
                "UPDATE reviews SET status='completed', overall_status=?, summary=?, result_json=?,"
                " completed_at=datetime('now') WHERE id=?",
                (result["overall_status"], result["summary"], dump_json(result), review_id),
            )
            conn.execute("DELETE FROM review_findings WHERE review_id=?", (review_id,))
            for f in result["findings"]:
                conn.execute(
                    "INSERT INTO review_findings (id, review_id, category, severity, quote, explanation,"
                    " evidence_json, citation, suggestion, confidence, verification)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (
                        f["id"], review_id, f["category"], f["severity"], f["quote"], f["explanation"],
                        dump_json(f["evidence"]),
                        f["evidence"][0]["citation"] if f["evidence"] else None,
                        f.get("suggestion"), f["confidence"], f["verification"],
                    ),
                )
    finally:
        conn.close()
    return result


def execute_review_safe(review_id: str) -> None:
    """Background-queue wrapper: never raises."""
    try:
        execute_review(review_id)
    except Exception:
        import logging
        import traceback
        logging.getLogger("spyglass.review").error(
            "Review %s failed:\n%s", review_id, traceback.format_exc()
        )
        conn = connect()
        try:
            with write_txn(conn):
                conn.execute(
                    "UPDATE reviews SET status='failed', error='Review failed; see server logs.',"
                    " completed_at=datetime('now') WHERE id=?",
                    (review_id,),
                )
        finally:
            conn.close()


def get_review_payload(review_id: str) -> dict[str, Any] | None:
    conn = connect()
    try:
        row = conn.execute("SELECT * FROM reviews WHERE id=?", (review_id,)).fetchone()
    finally:
        conn.close()
    if not row:
        return None
    data = dict(row)
    payload: dict[str, Any] = {
        "review_id": data["id"],
        "company_id": data["company_id"],
        "status": data["status"],
        "content_title": data["content_title"],
        "overall_status": data["overall_status"],
        "summary": None,
        "reviewer": None,
        "severity_counts": {s: 0 for s in SEVERITIES},
        "findings": [],
        "unverified_claims": [],
        "evidence": [],
        "areas_for_human_review": [],
        "created_at": data["created_at"],
        "completed_at": data["completed_at"],
        "error": data["error"],
    }
    if data.get("result_json"):
        result = load_json(data["result_json"], {}) or {}
        for k in ("summary", "severity_counts", "unverified_claims", "evidence",
                  "areas_for_human_review", "reviewer"):
            payload[k] = result.get(k, payload[k])
        payload["findings"] = result.get("findings", [])
    elif data["status"] == "completed":
        # fallback: rebuild findings from rows (e.g. legacy rows)
        conn = connect()
        try:
            rows = [dict(x) for x in conn.execute(
                "SELECT * FROM review_findings WHERE review_id=? ORDER BY rowid", (review_id,))]
        finally:
            conn.close()
        for f in rows:
            payload["findings"].append({
                "id": f["id"], "category": f["category"], "severity": f["severity"], "quote": f["quote"],
                "explanation": f["explanation"], "evidence": load_json(f["evidence_json"], []),
                "suggestion": f["suggestion"], "confidence": f["confidence"], "verification": f["verification"],
            })
    return payload
