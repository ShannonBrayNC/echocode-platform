from __future__ import annotations

from echocode.domain.ids import new_evidence_id
from echocode.domain.models import EvidenceBundle
from echocode.domain.enums import EvidenceStatus


class EvidenceService:
    def create_bundle(self, work_item_id: str, summary: str, artifacts: list[str]) -> EvidenceBundle:
        return EvidenceBundle(
            evidence_id=new_evidence_id(),
            work_item_id=work_item_id,
            summary=summary,
            artifacts=artifacts,
            notes=[],
            status=EvidenceStatus.COMPLETE,
        )