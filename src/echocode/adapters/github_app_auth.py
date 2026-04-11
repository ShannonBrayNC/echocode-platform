from __future__ import annotations

import os
import time
from pathlib import Path

import httpx
import jwt
from dotenv import load_dotenv


load_dotenv()


class GitHubAppAuth:
    def __init__(self) -> None:
        self.app_id = os.getenv("GITHUB_APP_ID", "").strip()
        self.installation_id = os.getenv("GITHUB_APP_INSTALLATION_ID", "").strip()
        self.private_key_path = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH", "").strip()
        self.owner = os.getenv("GITHUB_OWNER", "").strip()
        self.repo = os.getenv("GITHUB_REPO", "").strip()

        if not self.app_id:
            raise ValueError("GITHUB_APP_ID is required")
        if not self.installation_id:
            raise ValueError("GITHUB_APP_INSTALLATION_ID is required")
        if not self.private_key_path:
            raise ValueError("GITHUB_APP_PRIVATE_KEY_PATH is required")
        if not self.owner:
            raise ValueError("GITHUB_OWNER is required")
        if not self.repo:
            raise ValueError("GITHUB_REPO is required")

    def _read_private_key(self) -> str:
        key_path = Path(self.private_key_path)
        if not key_path.exists():
            raise FileNotFoundError(f"GitHub App private key not found: {key_path}")
        return key_path.read_text(encoding="utf-8")

    def _build_jwt(self) -> str:
        now = int(time.time())
        payload = {
            "iat": now - 60,
            "exp": now + 600,
            "iss": self.app_id,
        }

        private_key = self._read_private_key()
        token = jwt.encode(payload, private_key, algorithm="RS256")
        if isinstance(token, bytes):
            return token.decode("utf-8")
        return token

    def get_installation_token(self) -> str:
        jwt_token = self._build_jwt()

        response = httpx.post(
            f"https://api.github.com/app/installations/{self.installation_id}/access_tokens",
            headers={
                "Authorization": f"Bearer {jwt_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=30.0,
        )
        response.raise_for_status()

        data = response.json()
        return str(data["token"])