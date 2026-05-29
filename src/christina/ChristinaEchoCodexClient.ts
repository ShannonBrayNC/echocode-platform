import { runEchoCodexSprint, type EchoCodexSprintRunnerInput, type EchoCodexSprintRunnerResult } from "../runner/runEchoCodexSprint.js";

export type ChristinaDryRunRequest = Omit<EchoCodexSprintRunnerInput, "mode"> & {
  mode?: "dryRun";
  requestedCapability?: string;
};

export type ChristinaDryRunResponse = {
  ok: boolean;
  mode: "dryRun";
  requestedCapability?: string;
  reportPath: string;
  selectedIssue?: EchoCodexSprintRunnerResult["selectedIssue"];
  validationStatus: EchoCodexSprintRunnerResult["validationStatus"];
  policyDecision: EchoCodexSprintRunnerResult["policyDecision"];
  nextAction: EchoCodexSprintRunnerResult["nextAction"];
  safety: {
    dryRunOnly: true;
    liveWritesBlocked: boolean;
    requiresHumanApprovalForLiveWork: boolean;
  };
};

export async function sendChristinaDryRun(request: ChristinaDryRunRequest): Promise<ChristinaDryRunResponse> {
  const result = await runEchoCodexSprint({
    ...request,
    mode: "dryRun"
  });

  return {
    ok: result.mode === "dryRun" && Boolean(result.reportPath),
    mode: "dryRun",
    requestedCapability: request.requestedCapability,
    reportPath: result.reportPath,
    selectedIssue: result.selectedIssue,
    validationStatus: result.validationStatus,
    policyDecision: result.policyDecision,
    nextAction: result.nextAction,
    safety: {
      dryRunOnly: true,
      liveWritesBlocked: result.mode === "dryRun",
      requiresHumanApprovalForLiveWork: true
    }
  };
}

export function isValidChristinaDryRunResponse(response: ChristinaDryRunResponse): boolean {
  return (
    response.ok === true &&
    response.mode === "dryRun" &&
    response.safety.dryRunOnly === true &&
    response.safety.liveWritesBlocked === true &&
    response.safety.requiresHumanApprovalForLiveWork === true &&
    response.reportPath.trim().length > 0 &&
    Boolean(response.selectedIssue?.repo) &&
    Boolean(response.selectedIssue?.number) &&
    ["not-run", "preview", "passed", "failed", "blocked"].includes(response.validationStatus) &&
    ["allow", "block", "requires-human-approval"].includes(response.policyDecision.decision) &&
    response.nextAction.trim().length > 0
  );
}
