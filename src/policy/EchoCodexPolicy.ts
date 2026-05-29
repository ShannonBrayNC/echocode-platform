export type EchoCodexMode = "dryRun" | "writeWorkspace" | "createBranch" | "openPullRequest" | "autoMerge";

export type PolicyDecision = "allow" | "block" | "requires-human-approval";

export type PolicyReason = {
  code: string;
  message: string;
};

export type PathRule = {
  pattern: string;
  reason?: string;
};

export type RepoPolicyOverride = {
  repo: string;
  allowedModes?: EchoCodexMode[];
  requireHumanApprovalBeyondDryRun?: boolean;
  protectedBranches?: string[];
  allowPaths?: PathRule[];
  denyPaths?: PathRule[];
  allowAutoMerge?: boolean;
};

export type EchoCodexPolicy = {
  defaultMode: EchoCodexMode;
  allowedModes: EchoCodexMode[];
  requireHumanApprovalBeyondDryRun: boolean;
  protectedBranches: string[];
  allowPaths: PathRule[];
  denyPaths: PathRule[];
  allowAutoMerge: boolean;
  repoOverrides?: RepoPolicyOverride[];
};

export type PolicyGateInput = {
  policy: EchoCodexPolicy;
  requestedMode?: EchoCodexMode;
  repo: string;
  branch?: string;
  changedPaths?: string[];
  validationPassed?: boolean;
  humanApproval?: boolean;
};

export type PolicyGateResult = {
  decision: PolicyDecision;
  effectiveMode: EchoCodexMode;
  repo: string;
  branch?: string;
  reasons: PolicyReason[];
  humanApprovalRequired: boolean;
};

export const defaultEchoCodexPolicy: EchoCodexPolicy = {
  defaultMode: "dryRun",
  allowedModes: ["dryRun"],
  requireHumanApprovalBeyondDryRun: true,
  protectedBranches: ["main", "master", "production", "release"],
  allowPaths: [
    { pattern: "src/**" },
    { pattern: "tests/**" },
    { pattern: "docs/**" },
    { pattern: "README.md" },
    { pattern: "config/*.json" }
  ],
  denyPaths: [
    { pattern: ".env*", reason: "Environment and secret files are protected." },
    { pattern: "**/*.pem", reason: "Private key and certificate files are protected." },
    { pattern: "**/*.pfx", reason: "Private key and certificate files are protected." },
    { pattern: "**/*.key", reason: "Private key files are protected." },
    { pattern: ".github/workflows/**", reason: "Workflow changes require explicit policy approval." },
    { pattern: "CODEOWNERS", reason: "Code ownership changes require explicit policy approval." },
    { pattern: "package-lock.json", reason: "Lockfile changes require explicit policy approval." },
    { pattern: "pnpm-lock.yaml", reason: "Lockfile changes require explicit policy approval." },
    { pattern: "yarn.lock", reason: "Lockfile changes require explicit policy approval." }
  ],
  allowAutoMerge: false,
  repoOverrides: []
};
