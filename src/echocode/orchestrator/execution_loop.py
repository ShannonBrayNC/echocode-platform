from __future__ import annotations

from typing import Any

from echocode.adapters.repo_controller import RepoController
from echocode.agents.llm_coding_agent import LLMCodingAgent
from echocode.agents.test_agent import TestAgent
from echocode.services.architecture_guard_service import ArchitectureGuardService
from echocode.services.evidence_writer_service import EvidenceWriterService
from echocode.services.execution_service import ExecutionService
from echocode.services.repair_service import RepairService


class ExecutionLoop:
    def __init__(self) -> None:
        self.coder = LLMCodingAgent()
        self.tester = TestAgent()
        self.executor = ExecutionService()
        self.repair = RepairService()
        self.repo = RepoController()
        self.guard = ArchitectureGuardService()
        self.evidence = EvidenceWriterService()

    def run(self, work_item: dict[str, Any]) -> dict[str, Any]:
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

        commit_result = self.repo.simulate_commit(
            work_item["work_item_id"],
            f"Implement {work_item['title']}",
        )

        pr_result = self.repo.simulate_pr(
            work_item["work_item_id"],
            f"Work item {work_item['work_item_id']}",
            f"Automated PR for {work_item['title']}",
        )

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

        if success:
            result = {
                "status": "success",
                "stage": "complete",
                "work_item_id": work_item["work_item_id"],
                "code": code_result,
                "test": test_result,
                "commit": commit_result,
                "pr": pr_result,
                "output": output,
                "attempts": attempt + 1,
            }
            result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
            return result

        fix = self.repair.attempt_fix(output)
        result = {
            "status": "failed",
            "stage": "repair",
            "work_item_id": work_item["work_item_id"],
            "code": code_result,
            "test": test_result,
            "commit": commit_result,
            "pr": pr_result,
            "fix_attempted": fix,
            "output": output,
            "attempts": attempt + 1,
        }
        result["evidence_file"] = self.evidence.write(work_item["work_item_id"], result)
        return result