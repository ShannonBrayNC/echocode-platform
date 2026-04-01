from echocode.services.planning_service import PlanningService


def test_planning_generates_work_items() -> None:
    planner = PlanningService()

    requirement = {
        "requirement_id": "REQ-TEST",
        "title": "Test Feature",
        "description": "Test Description",
    }

    items = planner.decompose(requirement)

    assert len(items) == 2
    assert items[0]["requirement_ids"] == ["REQ-TEST"]