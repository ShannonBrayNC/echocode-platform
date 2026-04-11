from __future__ import annotations

import base64
from typing import Any

import httpx

from echocode.adapters.github_app_auth import GitHubAppAuth


class GitHubAppClient:
    def __init__(self) -> None:
        self.auth = GitHubAppAuth()

        self.owner = self.auth.owner
        self.repo = self.auth.repo
        self.base_branch = "main"

        self.repo_api = f"https://api.github.com/repos/{self.owner}/{self.repo}"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.auth.get_installation_token()}",
            "Accept": "application/vnd.github+json",
        }

    def _request(self, method: str, url: str, **kwargs: Any) -> Any:
        headers = kwargs.pop("headers", {})
        merged_headers = {**self._headers(), **headers}

        response = httpx.request(method, url, headers=merged_headers, **kwargs)
        response.raise_for_status()

        if response.content:
            return response.json()
        return {}

    def get_branch_sha(self, branch: str) -> str:
        data = self._request("GET", f"{self.repo_api}/git/ref/heads/{branch}")
        return data["object"]["sha"]

    def create_branch(self, branch: str, base_sha: str) -> None:
        self._request(
            "POST",
            f"{self.repo_api}/git/refs",
            json={
                "ref": f"refs/heads/{branch}",
                "sha": base_sha,
            },
        )

    def upsert_file(
        self,
        path: str,
        content: str,
        message: str,
        branch: str,
    ) -> None:
        url = f"{self.repo_api}/contents/{path}"

        encoded = base64.b64encode(content.encode()).decode()

        try:
            existing = self._request("GET", url, params={"ref": branch})
            sha = existing["sha"]
        except httpx.HTTPStatusError:
            sha = None

        payload = {
            "message": message,
            "content": encoded,
            "branch": branch,
        }

        if sha:
            payload["sha"] = sha

        self._request("PUT", url, json=payload)

    def create_pull_request(self, title: str, body: str, head: str) -> dict[str, Any]:
        return self._request(
            "POST",
            f"{self.repo_api}/pulls",
            json={
                "title": title,
                "body": body,
                "head": head,
                "base": self.base_branch,
            },
        )

    def add_issue_comment(self, issue_number: int, body: str) -> None:
        self._request(
            "POST",
            f"{self.repo_api}/issues/{issue_number}/comments",
            json={"body": body},
        )