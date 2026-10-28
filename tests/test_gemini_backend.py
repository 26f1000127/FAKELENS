"""Gemini backend wiring tests (no network: httpx.Client is stubbed).

Covers:
  - config derives the native Gemini root from the OpenAI-compat base URL
  - `embed_texts` uses the native `:batchEmbedContents` route for Gemini,
    with `x-goog-api-key` auth and the documented request shape
  - chat() falls back to a minimal payload when the endpoint rejects
    response_format/temperature with HTTP 400
"""
from __future__ import annotations

import json

import pytest

import spyglass.llm as llm
from spyglass.config import settings


def test_config_derives_gemini_root() -> None:
    assert settings.is_gemini is True
    assert settings.gemini_root == "https://generativelanguage.googleapis.com/v1beta"
    assert settings.chat_model == "gemini-4-argon"
    assert settings.embedding_model == "gemini-embedding-001"
    assert settings.offline_mode is True  # no key in the test environment


class _FakeResp:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def json(self) -> dict:
        return self._payload


class _FakeClient:
    """Records POSTs and replays canned responses (in call order)."""

    calls: list[dict] = []
    responses: list[_FakeResp] = []

    def __init__(self, *a, **kw):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def post(self, url, headers=None, json=None):
        _FakeClient.calls.append({"url": url, "headers": headers or {}, "json": json or {}})
        return _FakeClient.responses.pop(0)

    def close(self):
        pass


def test_gemini_embed_uses_native_batch_route(monkeypatch) -> None:
    monkeypatch.setattr(llm.httpx, "Client", _FakeClient)
    _FakeClient.calls.clear()
    _FakeClient.responses = [
        _FakeResp(200, {"embeddings": [{"values": [0.1, 0.2]}, {"values": [0.3, 0.4]}]})
    ]

    vectors = llm.embed_texts(["alpha", "beta"])

    assert vectors == [[0.1, 0.2], [0.3, 0.4]]
    call = _FakeClient.calls[0]
    assert call["url"] == (
        "https://generativelanguage.googleapis.com/v1beta"
        "/models/gemini-embedding-001:batchEmbedContents"
    )
    assert call["headers"]["x-goog-api-key"] == settings.openai_api_key
    assert "Authorization" not in call["headers"]
    assert call["json"]["requests"] == [
        {"model": "models/gemini-embedding-001", "content": {"parts": [{"text": "alpha"}]}},
        {"model": "models/gemini-embedding-001", "content": {"parts": [{"text": "beta"}]}},
    ]


def test_chat_retries_minimal_payload_on_400(monkeypatch) -> None:
    monkeypatch.setattr(llm.httpx, "Client", _FakeClient)
    _FakeClient.calls.clear()
    _FakeClient.responses = [
        _FakeResp(400, {"error": "response_format not supported"}),
        _FakeResp(200, {"choices": [{"message": {"content": '{"ok": true}'}}]}),
    ]

    out = llm.chat([{"role": "user", "content": "hi"}])

    assert json.loads(out) == {"ok": True}
    first, second = _FakeClient.calls
    assert "response_format" in first["json"] and "temperature" in first["json"]
    assert "response_format" not in second["json"] and "temperature" not in second["json"]
    assert first["url"] == second["url"]