from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_christina_repo_profile_documents_safe_review_contract() -> None:
    profile = json.loads((ROOT / ".christina" / "repo-profile.json").read_text(encoding="utf-8"))

    assert profile["repo"] == "ShannonBrayNC/echocode-platform"
    assert profile["defaultBranch"] == "main"
    assert "python -m pytest tests/unit -q" in profile["buildCommands"]
    assert "python tools/ci_validate.py" in profile["buildCommands"]
    assert profile["issuePolicy"]["duplicateHandling"].startswith("Update an existing open issue")
    assert "needs-codex" in profile["autoFixPolicy"]["allowedLabels"]
    assert profile["autoFixPolicy"]["requiresHumanApproval"] is True
    assert "secrets" in profile["autoFixPolicy"]["blockedScopes"]


def test_christina_review_docs_match_profile_fingerprint() -> None:
    profile = json.loads((ROOT / ".christina" / "repo-profile.json").read_text(encoding="utf-8"))
    docs = (ROOT / "docs" / "christina-repo-review.md").read_text(encoding="utf-8")

    assert profile["issuePolicy"]["fingerprintFormat"] in docs
    assert "ShannonBrayNC/echocode-platform" in docs
    assert "needs-codex" in docs
