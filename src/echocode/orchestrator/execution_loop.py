from __future__ import annotations

import os
from typing import Any

from echocode.agents.coding_agent import CodingAgent
from echocode.agents.test_agent import TestAgent
from echocode.services.architecture_guard_service import ArchitectureGuardService
from echocode.services.evidence_writer_service import EvidenceWriterService
from echocode.services.execution_service import ExecutionService
from echocode.services.repair_service import RepairService
from echocode.services.github_publish_service import GitHubPublishService


class ExecutionLoop:
    def __init__(
        self,
        publisher: GitHubPublishService | None = None,
        publish_enabled: bool | None = None,
    ) -> None:
        self.coder = CodingAgent()
        self.tester = TestAgent()
        self.executor = ExecutionService()
        self.repair = RepairService()
        self.guard = ArchitectureGuardService()
        self.evidence = EvidenceWriterService()
        self.publisher = publisher
        self.publish_enabled = publish_enabled if publish_enabled is not None else bool(os.getenv("GITHUB_APP_ID"))

    def run(self, work_item: dict[str, Any]) -> dict[str, Any]:
        # 🔒 Guard: validate allowed files
        guard_ok, guard_msg = self.guard.validate_allowed_files(work_item)
        if not guard_ok:
            result = {
                "status": "failed",
                "stage": "guard",
                "message": guard_msg,
                "work_item_id": work_item["work_item_id"],
            }
            result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
            return result

        # 🧠 Code generation
        code_result = self.coder.run({"work_item": work_item})
        if code_result.get("status") != "ok":
            result = {
                "status": "failed",
                "stage": "code",
                "code": code_result,
                "work_item_id": work_item["work_item_id"],
            }
            result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
            return result

        # 🔍 Guard: file exists
        file_ok, file_msg = self.guard.validate_generated_file_exists(code_result["file_written"])
        if not file_ok:
            result = {
                "status": "failed",
                "stage": "guard",
                "message": file_msg,
                "code": code_result,
                "work_item_id": work_item["work_item_id"],
            }
            result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
            return result

        # 🧪 Generate tests
        test_result = self.tester.run({"work_item": work_item})
        if test_result.get("status") != "ok":
            result = {
                "status": "failed",
                "stage": "test",
                "test": test_result,
                "work_item_id": work_item["work_item_id"],
            }
            result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
            return result

        # 🔁 Execute with retry loop
        max_retries = 2
        attempt = 0
        success = False
        output = ""

        while attempt <= max_retries:
            success, output = self.executor.run_tests()

            if success:
                break

            if attempt == max_retries:
                break

            fix_context = self.repair.attempt_fix(output)

            code_result = self.coder.run(
                {
                    "work_item": work_item,
                    "failure_context": fix_context,
                }
            )

            attempt += 1

        # 🚀 SUCCESS PATH
        if success:
            evidence_file = self.evidence.write(
                work_item["work_item_id"],
                {
                    "status": "success",
                    "output": output,
                    "attempts": attempt + 1,
                },
            )

            git_result = {"status": "skipped", "reason": "publish-disabled"}
            if self.publish_enabled:
                publisher = self.publisher or GitHubPublishService()
                git_result = publisher.publish_work_item(
                    work_item=work_item,
                    code_file=code_result["file_written"],
                    test_file=test_result["test_file"],
                    evidence_file=evidence_file,
                )

            return {
                "status": "success",
                "stage": "complete",
                "work_item_id": work_item["work_item_id"],
                "code": code_result,
                "test": test_result,
                "output": output,
                "attempts": attempt + 1,
                "evidence_file": evidence_file,
                "git": git_result,
            }

        # ❌ FAILURE PATH
        fix = self.repair.attempt_fix(output)

        evidence_file = self.evidence.write(
            work_item["work_item_id"],
            {
                "status": "failed",
                "output": output,
                "fix_attempted": fix,
                "attempts": attempt + 1,
            },
        )

        return {
            "status": "failed",
            "stage": "repair",
            "work_item_id": work_item["work_item_id"],
            "code": code_result,
            "test": test_result,
            "fix_attempted": fix,
            "output": output,
            "attempts": attempt + 1,
            "evidence_file": evidence_file,
        }
