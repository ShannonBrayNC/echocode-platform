export type FileChangeAction = "create" | "update" | "delete" | "rename" | "noop";

export type FileChange = {
  action: FileChangeAction;
  path: string;
  newPath?: string;
  before?: string;
  after?: string;
  rationale: string;
};

export type AutoApprovalMode = "disabled" | "safeOnly";

export type ProposedPatch = {
  issue: {
    repo: string;
    number: number;
    url?: string;
  };
  rationale: string;
  validationCommands: string[];
  rollbackNotes: string[];
  changes: FileChange[];
  autoApproval?: {
    mode: AutoApprovalMode;
    requestedBy?: string;
  };
};

export type PatchSafetySeverity = "info" | "warning" | "blocked";

export type PatchSafetyFinding = {
  severity: PatchSafetySeverity;
  code: string;
  path?: string;
  message: string;
};

export type PatchApprovalState = "approved" | "requires-human-review" | "blocked";

export type PatchSafetyOptions = {
  allowLockfileChanges?: boolean;
  allowWorkflowChanges?: boolean;
  allowBranchProtectionChanges?: boolean;
  autoApprovalMode?: AutoApprovalMode;
};

export type PatchSafetyResult = {
  safe: boolean;
  approvalState: PatchApprovalState;
  autoApproved: boolean;
  findings: PatchSafetyFinding[];
};
