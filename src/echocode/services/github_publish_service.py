from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from echocode.adapters.github_app_client import GitHubAppClient
from echocode.services.pr_tracking_service import PRTrackingService
from echocode.utils.files import read_text_file


class GitHubPublishService:
    def __init__(self) -> None:
        self.client = GitHubAppClient()
        self.pr_tracker = PRTrackingService()

    @staticmethod
    def build_branch_name(work_item: dict[str, Any]) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", str(work_item["title"]).lower()).strip("-")
        slug = slug[:48] if slug else "work-item"
        return f"wi/{work_item['work_item_id'].lower()}-{slug}"

    @staticmethod
    def _repo_relative(path_value: str) -> str:
        return str(Path(path_value)).replace("\\", "/")

    def publish_work_item(
        self,
        work_item: dict[str, Any],
        code_file: str,
        test_file: str,
        evidence_file: str,
        architecture_file: str | None = None,
    ) -> dict[str, Any]:
        branch_name = self.build_branch_name(work_item)
        branch_created, branch_name = self.pr_tracker.ensure_branch(branch_name)

        files_to_publish = [
            (code_file, f"{work_item['work_item_id']}: add generated code"),
            (test_file, f"{work_item['work_item_id']}: add generated tests"),
            (evidence_file, f"{work_item['work_item_id']}: add evidence bundle"),
        ]

        if architecture_file:
            files_to_publish.append(
                (architecture_file, f"{work_item['work_item_id']}: add architecture artifact")
            )

        published_paths: list[str] = []
        for local_path, commit_message in files_to_publish:
            repo_path = self._repo_relative(local_path)
            content = read_text_file(Path(local_path))
            self.client.upsert_file(
                path=repo_path,
                content=content,
                message=commit_message,
                branch=branch_name,
            )
            published_paths.append(repo_path)

        pr_body = self._build_pr_body(
            work_item=work_item,
            evidence_file=evidence_file,
            published_paths=published_paths,
            architecture_file=architecture_file,
        )

        existing_pr = self.pr_tracker.find_existing_pr(work_item)
        if existing_pr:
            pr_number = int(existing_pr["number"])
            pr_url = str(existing_pr["html_url"])
            self.client.add_issue_comment(
                issue_number=pr_number,
                body=(
                    f"Artifacts refreshed for `{work_item['work_item_id']}` on branch "
                    f"`{branch_name}`.\n\n"
                    f"Evidence bundle: `{self._repo_relative(evidence_file)}`"
                ),
            )
            return {
                "branch": branch_name,
                "pr_number": pr_number,
                "pr_url": pr_url,
                "published_files": published_paths,
                "status": "updated" if not branch_created else "created",
            }

        pr = self.client.create_pull_request(
            title=f"{work_item['work_item_id']} - {work_item['title']}",
            body=pr_body,
            head=branch_name,
        )

        self.client.add_issue_comment(
            issue_number=int(pr["number"]),
            body=f"Evidence bundle published: `{self._repo_relative(evidence_file)}`",
        )

        return {
            "branch": branch_name,
            "pr_number": pr["number"],
            "pr_url": pr["html_url"],
            "published_files": published_paths,
            "status": "created",
        }

    def _build_pr_body(
        self,
        work_item: dict[str, Any],
        evidence_file: str,
        published_paths: list[str],
        architecture_file: str | None,
    ) -> str:
        requirements = "\n".join(f"- {rid}" for rid in work_item.get("requirement_ids", [])) or "- None"
        outcomes = "\n".join(f"- {item}" for item in work_item.get("expected_outcomes", [])) or "- None"
        files = "\n".join(f"- `{path}`" for path in published_paths)
        architecture_line = (
            f"`{self._repo_relative(architecture_file)}`" if architecture_file else "_Not provided_"
        )

        return (
            f"## Work Item\n"
            f"- ID: `{work_item['work_item_id']}`\n"
            f"- Title: {work_item['title']}\n\n"
            f"## Requirement IDs\n"
            f"{requirements}\n\n"
            f"## Expected Outcomes\n"
            f"{outcomes}\n\n"
            f"## Published Files\n"
            f"{files}\n\n"
            f"## Architecture Artifact\n"
            f"{architecture_line}\n\n"
            f"## Evidence\n"
            f"`{self._repo_relative(evidence_file)}`\n"
        )
