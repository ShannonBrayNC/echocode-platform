from __future__ import annotations

from typing import Any

import httpx

from echocode.adapters.github_app_client import GitHubAppClient


class PRTrackingService:
    def __init__(self) -> None:
        self.client = GitHubAppClient()

    def branch_exists(self, branch_name: str) -> bool:
        try:
            self.client.get_branch_sha(branch_name)
            return True
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return False
            raise

    def ensure_branch(self, branch_name: str) -> tuple[bool, str]:
        if self.branch_exists(branch_name):
            return False, branch_name

        base_sha = self.client.get_branch_sha(self.client.base_branch)
        self.client.create_branch(branch_name, base_sha)
        return True, branch_name

    def find_existing_pr(self, work_item: dict[str, Any]) -> dict[str, Any] | None:
        work_item_id = str(work_item["work_item_id"])
        pulls = self.client._request(
            "GET",
            f"{self.client.repo_api}/pulls",
            params={
                "state": "open",
                "base": self.client.base_branch,
            },
        )

        for pr in pulls:
            title = str(pr.get("title", ""))
            head = pr.get("head", {}) or {}
            head_ref = str(head.get("ref", ""))
            if work_item_id in title or work_item_id.lower() in head_ref.lower():
                return pr

        return None
