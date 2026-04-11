from __future__ import annotations

import json

import typer
from rich.console import Console
from rich.pretty import Pretty

from echocode import __version__
from echocode.app import PROJECT_ROOT
from echocode.domain.models import WorkItem
from echocode.services.evidence_service import EvidenceService
from echocode.services.policy_service import PolicyService
from echocode.services.traceability_service import TraceabilityService
from echocode.utils.files import ensure_directory, write_text_file
from echocode.utils.json_tools import load_json_file
from echocode.orchestrator.workflow import WorkflowEngine

app = typer.Typer(help="EchoCode Platform CLI")
console = Console()


@app.command()
def health() -> None:
    console.print("[green]EchoCode Platform is alive.[/green]")


@app.command()
def version() -> None:
    console.print(f"EchoCode Platform v{__version__}")


@app.command("validate-policy")
def validate_policy() -> None:
    service = PolicyService.from_default_paths(PROJECT_ROOT)
    console.print(Pretty(service.summary()))



@app.command("run-pipeline")
def run_pipeline() -> None:
    fixtures_dir = PROJECT_ROOT / "tests" / "fixtures"
    req_data = load_json_file(fixtures_dir / "sample_requirement.json")

    engine = WorkflowEngine()
    result = engine.run(req_data)

    console.print("[bold green]Pipeline complete[/bold green]")
    console.print(Pretty(result))
    

@app.command("seed-sample")
def seed_sample() -> None:
    fixtures_dir = PROJECT_ROOT / "tests" / "fixtures"
    artifacts_dir = PROJECT_ROOT / "artifacts"
    ensure_directory(artifacts_dir)

    req_data = load_json_file(fixtures_dir / "sample_requirement.json")
    wi_data = load_json_file(fixtures_dir / "sample_work_item.json")

    if not isinstance(req_data, dict):
        raise TypeError("Expected sample_requirement.json to contain a JSON object.")

    if not isinstance(wi_data, dict):
        raise TypeError("Expected sample_work_item.json to contain a JSON object.")

    work_item = WorkItem.model_validate(wi_data)

    trace_service = TraceabilityService()
    evidence_service = EvidenceService()

    trace_record = trace_service.link_work_item(
        requirement_ids=work_item.requirement_ids,
        work_item=work_item,
    )
    evidence = evidence_service.create_bundle(
        work_item_id=work_item.work_item_id,
        summary="Seeded sample evidence bundle for initial platform validation.",
        artifacts=["artifacts/sample-log.txt", "artifacts/sample-report.json"],
    )

    write_text_file(
        artifacts_dir / "sample_traceability.json",
        json.dumps(trace_record, indent=2),
    )
    write_text_file(
        artifacts_dir / "sample_evidence_bundle.json",
        evidence.model_dump_json(indent=2),
    )

    console.print("[green]Sample artifacts created.[/green]")