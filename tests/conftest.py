import os
import sys
from pathlib import Path

# Run offline & isolated for the whole test suite: clear every provider key so
# an outer real GEMINI_API_KEY/OPENAI_API_KEY can never make tests hit the network.
os.environ["GEMINI_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["ADMIN_API_KEY"] = "test-key"
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pytest

@pytest.fixture(autouse=True)
def tmp_db(tmp_path, monkeypatch):
    db = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    # settings was instantiated at import; rebuild it for the test's env
    from spyglass.config import settings
    settings.reload()
    yield


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from spyglass.main import app
    app.router.lifespan_context = getattr(app.router, "lifespan_context", None)
    with TestClient(app, raise_server_exceptions=True) as c:
        c.headers["X-API-Key"] = "test-key"
        yield c
