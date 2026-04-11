from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from echocode.utils.json_tools import load_yaml_file


@dataclass
class PolicyService:
    project_root: Path
    policy: dict
    settings: dict
    approvals: dict

    @classmethod
    def from_default_paths(cls, project_root: Path) -> "PolicyService":
        config_dir = project_root / "config"
        return cls(
            project_root=project_root,
            policy=load_yaml_file(config_dir / "policy.yaml"),
            settings=load_yaml_file(config_dir / "settings.yaml"),
            approvals=load_yaml_file(config_dir / "approvals.yaml"),
        )

    def summary(self) -> dict[str, object]:
        return {
            "required_pr_fields": self.policy.get("required_pr_fields", []),
            "traceability": self.policy.get("traceability", {}),
            "coding_rules": self.policy.get("coding_rules", {}),
            "approval_gates": self.approvals.get("gates", {}),
            "app_settings": self.settings.get("app", {}),
        }

    def require_tests_for_code_changes(self) -> bool:
        return bool(self.policy.get("coding_rules", {}).get("require_tests_for_code_changes", True))

    def required_pr_fields(self) -> list[str]:
        return list(self.policy.get("required_pr_fields", []))