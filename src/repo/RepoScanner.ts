import { detectProjectTypes } from "./detectProjectType.js";
import type { RepoInventory, RepoScannerInput, SensitivePathFinding } from "./RepoInventory.js";

const MANIFEST_FILES = new Set([
  "package.json",
  "tsconfig.json",
  "pyproject.toml",
  "requirements.txt",
  "pytest.ini",
  "host.json",
  "function.json",
  "config.json"
]);

const PACKAGE_MANAGER_FILES: Record<string, string> = {
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "requirements.txt": "pip",
  "pyproject.toml": "python-project",
  "poetry.lock": "poetry"
};

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function baseName(path: string): string {
  const normalized = normalizePath(path);
  return normalized.split("/").at(-1) ?? normalized;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function detectSensitivePaths(files: string[]): SensitivePathFinding[] {
  return files
    .filter((file) => {
      const lower = file.toLowerCase();
      return (
        lower.endsWith(".env") ||
        lower.includes("/.env") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("token") ||
        lower.endsWith(".pem") ||
        lower.endsWith(".pfx") ||
        lower.endsWith(".key") ||
        lower.endsWith(".crt")
      );
    })
    .map((path) => ({
      path,
      reason: "Potential secret, credential, token, or certificate path. Do not read or log raw contents."
    }));
}

function detectBuildHints(files: string[]): string[] {
  const hints: string[] = [];

  if (files.some((file) => baseName(file) === "package.json")) {
    hints.push("npm run build");
  }

  if (files.some((file) => baseName(file) === "pyproject.toml" || baseName(file) === "requirements.txt")) {
    hints.push("python -m compileall .");
  }

  return hints;
}

function detectTestHints(files: string[]): string[] {
  const hints: string[] = [];

  if (files.some((file) => baseName(file) === "package.json")) {
    hints.push("npm test");
  }

  if (
    files.some(
      (file) =>
        baseName(file) === "pytest.ini" ||
        file.toLowerCase().endsWith("_test.py") ||
        file.toLowerCase().endsWith("test_app.py") ||
        file.toLowerCase().startsWith("tests/") && file.toLowerCase().endsWith(".py")
    )
  ) {
    hints.push("pytest");
  }

  if (files.some((file) => file.toLowerCase().endsWith(".tests.ps1") || file.toLowerCase().includes("pester"))) {
    hints.push("Invoke-Pester");
  }

  return hints;
}

export function scanRepository(input: RepoScannerInput): RepoInventory {
  const files = uniqueSorted(input.fileTree.map(normalizePath).filter(Boolean));
  const manifests = files.filter((file) => MANIFEST_FILES.has(baseName(file)));
  const packageManagers = uniqueSorted(
    files
      .map((file) => PACKAGE_MANAGER_FILES[baseName(file)])
      .filter((manager): manager is string => Boolean(manager))
  );

  return {
    repositoryName: input.repositoryName,
    projectTypes: detectProjectTypes(files),
    files,
    manifests,
    packageManagers,
    buildHints: uniqueSorted(detectBuildHints(files)),
    testHints: uniqueSorted(detectTestHints(files)),
    ciWorkflows: files.filter((file) => file.startsWith(".github/workflows/")),
    docs: files.filter((file) => /(^|\/)readme\.md$/i.test(file) || file.startsWith("docs/")),
    sensitivePaths: detectSensitivePaths(files)
  };
}
