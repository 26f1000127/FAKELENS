"""LLM + embeddings access (Gemini backend by default, any OpenAI-compatible fallback).

Two modes, selected automatically from settings.offline_mode:
  - Online: GEMINI_API_KEY (or OPENAI_API_KEY) against an OpenAI-compatible
    server (`POST /chat/completions`, `POST /embeddings`). The shipped .env
    points at Google's Gemini endpoint with CHAT_MODEL=gemini-4-argon and
    EMBEDDING_MODEL=gemini-embedding-001.
  - Offline (no key): a deterministic local fallback so the whole pipeline runs
    in demos and tests without credentials -- hashing pseudo-embeddings and
    a transparent, rule-based "reviewer" that is clearly labelled offline.

The online mode trusts only what evidence supports; prompts are shared by both
modes (see review.py), but the offline reviewer is a heuristic stand-in, not a
substitute for the LLM evaluation path.
"""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any

import httpx

from spyglass.config import settings

_TIMEOUT = httpx.Timeout(120.0)


# ========================================================================== #
# Online clients
# ========================================================================== #

def chat(messages: list[dict[str, str]], *, json_mode: bool = True, temperature: float = 0.0) -> str:
    """Single chat completion. Returns model text. Raises on HTTP errors.

    If the endpoint rejects the strict payload (some OpenAI-compatible servers
    do not support `response_format`/`temperature`), retry once with the minimal
    payload before failing -- the JSON schema is already enforced by the prompt
    plus `parse_llm_json` downstream.
    """
    payload: dict[str, Any] = {
        "model": settings.chat_model,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.post(f"{settings.openai_base_url}/chat/completions", headers=headers, json=payload)
        if resp.status_code == 400 and ("response_format" in payload or "temperature" in payload):
            minimal: dict[str, Any] = {"model": settings.chat_model, "messages": messages}
            resp = client.post(f"{settings.openai_base_url}/chat/completions", headers=headers, json=minimal)
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


def embed_texts(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """Embed many texts. Returns one vector per input, in order.

    Gemini: native `POST /v1beta/models/{model}:batchEmbedContents`
    (its OpenAI-compatible layer has no /embeddings route — verified 404).
    Any other provider: standard OpenAI `POST /embeddings`.
    """
    if settings.is_gemini:
        return _gemini_embed(texts, batch_size=batch_size)
    return _openai_embed(texts, batch_size=batch_size)


def _openai_embed(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    out: list[list[float]] = []
    with httpx.Client(timeout=_TIMEOUT) as client:
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            resp = client.post(
                f"{settings.openai_base_url}/embeddings",
                headers=headers,
                json={"model": settings.embedding_model, "input": batch},
            )
            resp.raise_for_status()
            data = resp.json()["data"]
            data.sort(key=lambda d: d["index"])
            out.extend([d["embedding"] for d in data])
    return out


def _gemini_embed(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Native Gemini batch embeddings. API-key header auth (`x-goog-api-key`)."""
    model = settings.embedding_model
    if not model.startswith("models/"):
        model = f"models/{model}"
    headers = {"x-goog-api-key": settings.openai_api_key, "Content-Type": "application/json"}
    url = f"{settings.gemini_root}/models/{model.removeprefix('models/')}:batchEmbedContents"
    out: list[list[float]] = []
    with httpx.Client(timeout=_TIMEOUT) as client:
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            resp = client.post(
                url,
                headers=headers,
                json={"requests": [
                    {"model": model, "content": {"parts": [{"text": t}]}} for t in batch
                ]},
            )
            resp.raise_for_status()
            out.extend([e["values"] for e in resp.json()["embeddings"]])
    if len(out) != len(texts):
        raise RuntimeError("Gemini embeddings returned %d vectors for %d inputs" % (len(out), len(texts)))
    return out


# ========================================================================== #
# Offline fallback (deterministic, no network)
# ========================================================================== #

def _hash_tiles(text: str, dim: int = 256) -> list[float]:
    """Deterministic character-trigram hashing embedding, L2-normalized."""
    norm = re.sub(r"\s+", " ", text.lower()).strip()
    vec = [0.0] * dim
    if not norm:
        return vec
    grams = [norm[i : i + 3] for i in range(len(norm) - 2)]
    for g in grams or [norm]:
        h = int.from_bytes(hashlib.sha1(g.encode("utf-8")).digest()[:8], "big")
        idx = h % dim
        sign = 1.0 if (h >> 63) & 1 else -1.0
        vec[idx] += sign
    norm2 = sum(v * v for v in vec) ** 0.5
    return [v / norm2 for v in vec]


def embed_texts_any(texts: list[str]) -> list[list[float]]:
    if settings.offline_mode:
        return [_hash_tiles(t) for t in texts]
    return embed_texts(texts)


# json extraction used by review pipeline in online mode
_JSON_BLOCK = re.compile(r"\{.*\}", re.DOTALL)


def parse_llm_json(raw: str) -> dict[str, Any]:
    """Extract the JSON object from a model reply; tolerate fenced output."""
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        pass
    m = _JSON_BLOCK.search(raw)
    if m:
        try:
            return json.loads(m.group(0))
        except (ValueError, TypeError):
            pass
    raise ValueError("Model did not return valid JSON")
