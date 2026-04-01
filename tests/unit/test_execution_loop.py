from echocode.orchestrator.execution_loop import ExecutionLoop


def test_execution_loop_runs() -> None:
    loop = ExecutionLoop()

    work_item = {
        "work_item_id": "WI-TEST123",
        "title": "Test execution",
        "requirement_ids": ["REQ-TEST123"],
        "allowed_files": ["src/echocode/generated/req_test123.py"],
        "expected_outcomes": ["Code created", "Tests created"],
        "status": "planned",
    }

    result = loop.run(work_item)

    assert "status" in result
    assert result["status"] in {"success", "failed"}