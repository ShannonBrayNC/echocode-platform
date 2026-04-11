from echocode.domain.enums import RequirementStatus, WorkItemStatus
from echocode.domain.models import Requirement, WorkItem


def test_requirement_model() -> None:
    requirement = Requirement(
        requirement_id="REQ-ABC123",
        title="Test requirement",
        description="This is a valid test requirement payload.",
        acceptance_criteria=["It validates"],
        status=RequirementStatus.DRAFT,
    )
    assert requirement.requirement_id == "REQ-ABC123"
    assert requirement.status == RequirementStatus.DRAFT


def test_work_item_model() -> None:
    work_item = WorkItem(
        work_item_id="WI-ABC123",
        title="Test work item",
        requirement_ids=["REQ-ABC123"],
        expected_outcomes=["Outcome 1"],
        status=WorkItemStatus.PLANNED,
    )
    assert work_item.work_item_id == "WI-ABC123"
    assert work_item.requirement_ids == ["REQ-ABC123"]