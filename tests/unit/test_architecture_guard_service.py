from echocode.services.architecture_guard_service import ArchitectureGuardService


def test_validate_allowed_files_accepts_generated_path() -> None:
    service = ArchitectureGuardService()

    ok, message = service.validate_allowed_files(
        {
            "allowed_files": ["src/echocode/generated/req_abc123.py"],
        }
    )

    assert ok is True
    assert "validated" in message.lower()


def test_validate_allowed_files_rejects_non_generated_path() -> None:
    service = ArchitectureGuardService()

    ok, message = service.validate_allowed_files(
        {
            "allowed_files": ["src/echocode/services/policy_service.py"],
        }
    )

    assert ok is False
    assert "disallowed" in message.lower()