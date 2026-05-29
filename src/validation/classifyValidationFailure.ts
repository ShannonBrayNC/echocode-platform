import type { ValidationCommandKind, ValidationFailureClass } from "./ValidationReport.js";

export function classifyValidationFailure(params: {
  kind: ValidationCommandKind;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}): ValidationFailureClass {
  if (params.exitCode === 0 || params.exitCode === undefined) {
    return "none";
  }

  const output = `${params.stdout ?? ""}\n${params.stderr ?? ""}`.toLowerCase();

  if (output.includes("cannot find module") || output.includes("module not found") || output.includes("no module named")) {
    return "dependency-install";
  }

  if (params.kind === "test" || output.includes("test failed") || output.includes("assertionerror")) {
    return "test-failure";
  }

  if (params.kind === "typecheck" || output.includes("type error") || output.includes("tsc")) {
    return "typecheck-failure";
  }

  if (params.kind === "lint" || output.includes("eslint") || output.includes("ruff")) {
    return "lint-failure";
  }

  if (params.kind === "build" || output.includes("build failed")) {
    return "build-failure";
  }

  if (output.includes("exception") || output.includes("traceback") || output.includes("runtimeerror")) {
    return "runtime-error";
  }

  return "unknown";
}
