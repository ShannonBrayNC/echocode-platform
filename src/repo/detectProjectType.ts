import type { ProjectType } from "./RepoInventory.js";

function hasFile(files: string[], fileName: string): boolean {
  return files.some((file) => file.endsWith(fileName));
}

function hasExtension(files: string[], extension: string): boolean {
  return files.some((file) => file.toLowerCase().endsWith(extension));
}

function hasPathPart(files: string[], part: string): boolean {
  return files.some((file) => file.toLowerCase().includes(part.toLowerCase()));
}

export function detectProjectTypes(files: string[]): ProjectType[] {
  const detected = new Set<ProjectType>();

  if (hasFile(files, "package.json")) {
    detected.add("node");
  }

  if (hasFile(files, "tsconfig.json") || hasExtension(files, ".ts") || hasExtension(files, ".tsx")) {
    detected.add("typescript");
  }

  if (
    hasFile(files, "pyproject.toml") ||
    hasFile(files, "requirements.txt") ||
    hasFile(files, "pytest.ini") ||
    hasExtension(files, ".py")
  ) {
    detected.add("python");
  }

  if (hasExtension(files, ".ps1") || hasExtension(files, ".psm1") || hasExtension(files, ".psd1")) {
    detected.add("powershell");
  }

  if (hasFile(files, "config.json") && hasPathPart(files, "sharepoint")) {
    detected.add("spfx");
  }

  if (hasFile(files, "host.json") || hasPathPart(files, "function.json")) {
    detected.add("azure-functions");
  }

  if (detected.size > 1) {
    detected.add("mixed");
  }

  if (detected.size === 0) {
    detected.add("unknown");
  }

  return Array.from(detected);
}
