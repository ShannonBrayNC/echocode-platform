from echocode.domain.enums import WorkItemStatus
from echocode.domain.models import WorkItem
from echocode.services.traceability_service import TraceabilityService


def test_link_work_item() -> None:
    service = TraceabilityService()
    work_item = WorkItem(
        work_item_id="WI-ABC123",
        title="Traceability test item",
        requirement_ids=["REQ-ABC123"],
        expected_outcomes=["Outcome 1"],
        status=WorkItemStatus.PLANNED,
    )

    record = service.link_work_item(requirement_ids=["REQ-ABC123"], work_item=work_item)

    assert record["work_item_id"] == "WI-ABC123"
    assert record["requirement_ids"] == ["REQ-ABC123"]