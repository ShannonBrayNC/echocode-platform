from echocode.app import PROJECT_ROOT
from echocode.services.policy_service import PolicyService


def test_policy_service_loads() -> None:
    service = PolicyService.from_default_paths(PROJECT_ROOT)
    summary = service.summary()

    assert "required_pr_fields" in summary
    assert service.require_tests_for_code_changes() is True
    assert len(service.required_pr_fields()) >= 1