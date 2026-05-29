export type ProjectType =
  | "node"
  | "typescript"
  | "python"
  | "powershell"
  | "spfx"
  | "azure-functions"
  | "mixed"
  | "unknown";

export type SensitivePathFinding = {
  path: string;
  reason: string;
};

export type RepoInventory = {
  repositoryName?: string;
  projectTypes: ProjectType[];
  files: string[];
  manifests: string[];
  packageManagers: string[];
  buildHints: string[];
  testHints: string[];
  ciWorkflows: string[];
  docs: string[];
  sensitivePaths: SensitivePathFinding[];
};

export type RepoScannerInput = {
  repositoryName?: string;
  fileTree: string[];
};
