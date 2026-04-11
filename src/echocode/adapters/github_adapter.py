from __future__ import annotations

from dataclasses import dataclass


@dataclass
class GitHubAdapter:
    owner: str
    repo: str

    def repo_slug(self) -> str:
        return f"{self.owner}/{self.repo}"

    def create_issue_payload(self, title: str, body: str) -> dict[str, str]:
        return {
            "title": title,
            "body": body,
        }