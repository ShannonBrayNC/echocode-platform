export type EchoCodexEventType =
  | "IssueSelected"
  | "PlanGenerated"
  | "PatchProposed"
  | "ValidationCompleted"
  | "PolicyBlocked"
  | "HumanApprovalRequired"
  | "RunCompleted";

export type EchoCodexProvenance = {
  sourceSystem: string;
  sourceActor: string;
  sourceRunId?: string;
  sourceIssue?: string;
  createdAt: string;
  signature?: string;
};

export type EchoCodexEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  eventId: string;
  eventType: EchoCodexEventType;
  repo: string;
  runId?: string;
  timestamp: string;
  provenance: EchoCodexProvenance;
  payload: TPayload;
};

export function createEchoCodexEvent<TPayload extends Record<string, unknown>>(params: {
  eventType: EchoCodexEventType;
  repo: string;
  runId?: string;
  timestamp: string;
  provenance: EchoCodexProvenance;
  payload: TPayload;
}): EchoCodexEvent<TPayload> {
  const eventId = [
    params.timestamp.replace(/[^0-9]/g, "").slice(0, 14),
    params.repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    params.eventType.toLowerCase()
  ].join("-");

  return {
    eventId,
    eventType: params.eventType,
    repo: params.repo,
    runId: params.runId,
    timestamp: params.timestamp,
    provenance: params.provenance,
    payload: params.payload
  };
}
