import type { EchoCodexMode } from "../../policy/EchoCodexPolicy.js";
import type { EchoCodexProvenance } from "../events/EchoCodexEvent.js";

export type ETSTrustState = "Verified" | "Unverified" | "RequiresHumanReview" | "Rejected";

export type ETSVerificationInput = {
  recommendationId: string;
  provenance?: EchoCodexProvenance;
  requestedMode?: EchoCodexMode;
  payload?: Record<string, unknown>;
};

export type ETSVerificationResult = {
  trustState: ETSTrustState;
  recommendationId: string;
  canTriggerWriteOrPr: boolean;
  reasons: string[];
};

export interface ETSVerifier {
  verify(input: ETSVerificationInput): Promise<ETSVerificationResult>;
}

function isWriteOrPrMode(mode?: EchoCodexMode): boolean {
  return mode === "writeWorkspace" || mode === "createBranch" || mode === "openPullRequest" || mode === "autoMerge";
}

export function evaluateLocalTrust(input: ETSVerificationInput): ETSVerificationResult {
  if (!input.provenance) {
    return {
      trustState: "RequiresHumanReview",
      recommendationId: input.recommendationId,
      canTriggerWriteOrPr: false,
      reasons: ["Missing provenance metadata."]
    };
  }

  if (!input.provenance.sourceSystem || !input.provenance.sourceActor || !input.provenance.createdAt) {
    return {
      trustState: "RequiresHumanReview",
      recommendationId: input.recommendationId,
      canTriggerWriteOrPr: false,
      reasons: ["Incomplete provenance metadata."]
    };
  }

  if (!input.provenance.signature) {
    return {
      trustState: isWriteOrPrMode(input.requestedMode) ? "RequiresHumanReview" : "Unverified",
      recommendationId: input.recommendationId,
      canTriggerWriteOrPr: false,
      reasons: ["No ETS signature is present. External recommendation cannot trigger write or PR actions."]
    };
  }

  return {
    trustState: "Verified",
    recommendationId: input.recommendationId,
    canTriggerWriteOrPr: true,
    reasons: ["Local no-op verifier accepted signed provenance shape. No external ETS service was called."]
  };
}

export class NoopETSVerifier implements ETSVerifier {
  async verify(input: ETSVerificationInput): Promise<ETSVerificationResult> {
    return evaluateLocalTrust(input);
  }
}
