"""Application configuration, loaded from environment / .env."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Force-load a local .env if present (non-destructive; real env wins).
load_dotenv(Path(".env"), override=False)


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


class Settings:
    """Runtime settings. Attribute values are read at first access and cached."""

    def __init__(self) -> None:
        # LLM / embeddings use Gemini through its OpenAI-compatible API by
        # default.  The OPENAI_* names remain supported for a self-hosted or
        # other compatible provider, preserving the existing deployment path.
        self.openai_api_key: str = (
            os.getenv("GEMINI_API_KEY", "").strip()
            or os.getenv("OPENAI_API_KEY", "").strip()
        )
        self.openai_base_url: str = os.getenv(
            "OPENAI_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta/openai",
        ).rstrip("/")
        self.chat_model: str = os.getenv("CHAT_MODEL", "gemini-4-argon")
        self.embedding_model: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
        # Gemini's OpenAI-compatible layer serves chat only; embeddings must go
        # through the native `:batchEmbedContents` route. Derive the native root
        # (…/v1beta) from the OpenAI-compat base (…/v1beta/openai) when present.
        self.is_gemini: bool = "generativelanguage.googleapis.com" in self.openai_base_url
        self.gemini_root: str = (
            self.openai_base_url.removesuffix("/openai") if self.is_gemini else ""
        )

        # Offline demo mode: no key -> local hashing embedder + deterministic rule engine.
        self.offline_mode: bool = not self.openai_api_key

        # Storage.
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/spyglass.db")
        if not self.database_url.lower().startswith("sqlite:///"):
            raise ValueError("Only sqlite:/// URLs are supported; got %s" % self.database_url)
        self.db_path: Path = Path(self.database_url[len("sqlite:///"):])
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        # API auth.
        self.admin_api_key: str = os.getenv("ADMIN_API_KEY", "dev-admin-key")

        # Limits. (.env ships REVIEW_CONTENT_MAX_CHARS; MAX_REVIEW_CONTENT_CHARS
        # is accepted as an alias for backwards compatibility.)
        self.retrieval_top_k: int = max(4, _env_int("RETRIEVAL_TOP_K", 16))
        self.max_review_content_chars: int = max(
            2000,
            _env_int("REVIEW_CONTENT_MAX_CHARS", 0)
            or _env_int("MAX_REVIEW_CONTENT_CHARS", 60000),
        )
        self.max_doc_chunk_chars: int = max(400, _env_int("MAX_CHUNK_CHARS", 1400))
        self.overlap_chunks: float = max(0.0, min(0.5, _env_int("CHUNK_OVERLAP", 120) / self.max_doc_chunk_chars))

    def reload(self) -> None:
        """Re-read configuration from the environment (used by tests).

        Real environment variables always win: .env values are only filled in
        when a variable is absent, never overriding an explicit setting
        (override=True here used to clobber test-provided ADMIN_API_KEY and
        DATABASE_URL, breaking every request with 401s).
        """
        load_dotenv(Path(".env"), override=False)
        vars(self).clear()
        self.__init__()


settings = Settings()
