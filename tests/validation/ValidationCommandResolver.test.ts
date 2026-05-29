import assert from "node:assert/strict";
import test from "node:test";

import { classifyValidationFailure } from "../../src/validation/classifyValidationFailure.js";
import { resolveValidationCommands } from "../../src/validation/ValidationCommandResolver.js";
import { createPreviewValidationReport } from "../../src/validation/ValidationReport.js";
import type { RepoInventory } from "../../src/repo/RepoInventory.js";

function inventory(overrides: Partial<RepoInventory> = {}): RepoInventory {
  return {
    repositoryName: "ShannonBrayNC/example",
    projectTypes: ["unknown"],
    files: [],
    manifests: [],
    packageManagers: [],
    buildHints: [],
    testHints: [],
    ciWorkflows: [],
    docs: [],
    sensitivePaths: [],
    ...overrides
  };
}

test("resolves Node and TypeScript commands", () => {
  const result = resolveValidationCommands(
    inventory({
      projectTypes: ["node", "typescript"],
      files: ["package.json", "tsconfig.json", "src/index.ts"],
      manifests: ["package.json", "tsconfig.json"],
      packageManagers: ["npm"],
      buildHints: ["npm run build"],
      testHints: ["npm test"]
    })
  );

  assert.deepEqual(
    result.commands.map((command) => `${command.kind}:${command.command}`),
    [
      "build:npm run build",
      "lint:npm run lint",
      "test:npm test",
      "typecheck:npm run typecheck"
    ]
  );
  assert.deepEqual(result.warnings, []);
});

test("resolves Python pytest, mypy, and ruff commands", () => {
  const result = resolveValidationCommands(
    inventory({
      projectTypes: ["python"],
      files: ["pyproject.toml", "src/app.py", "tests/test_app.py"],
      manifests: ["pyproject.toml"],
      packageManagers: ["python-project"],
      testHints: ["pytest"]
    })
  );

  assert.deepEqual(
    result.commands.map((command) => `${command.kind}:${command.command}`),
    [
      "lint:ruff check .",
      "test:pytest",
      "typecheck:mypy ."
    ]
  );
  assert.deepEqual(result.warnings, []);
});

test("resolves PowerShell Pester command", () => {
  const result = resolveValidationCommands(
    inventory({
      projectTypes: ["powershell"],
      files: ["tools/Invoke-Thing.ps1", "tests/Invoke-Thing.Tests.ps1"]
    })
  );

  assert.deepEqual(result.commands.map((command) => command.command), ["Invoke-Pester"]);
  assert.equal(result.commands[0].required, true);
  assert.deepEqual(result.warnings, []);
});

test("resolves mixed repository commands deterministically", () => {
  const result = resolveValidationCommands(
    inventory({
      projectTypes: ["node", "typescript", "python", "powershell", "mixed"],
      files: ["package.json", "tsconfig.json", "pyproject.toml", "src/app.py", "scripts/check.ps1", "tests/check.Tests.ps1"],
      manifests: ["package.json", "tsconfig.json", "pyproject.toml"],
      buildHints: ["npm run build"],
      testHints: ["npm test", "pytest"]
    })
  );

  assert.deepEqual(
    result.commands.map((command) => `${command.kind}:${command.command}`),
    [
      "build:npm run build",
      "lint:npm run lint",
      "lint:ruff check .",
      "test:Invoke-Pester",
      "test:npm test",
      "test:pytest",
      "typecheck:mypy .",
      "typecheck:npm run typecheck"
    ]
  );
});

test("missing validations return warnings", () => {
  const result = resolveValidationCommands(inventory());

  assert.deepEqual(result.commands, []);
  assert.deepEqual(result.warnings, [
    "No validation commands could be resolved from repository inventory.",
    "No required validation commands were resolved. Christina should treat this sprint as blocked until validation is defined."
  ]);
});

test("preview validation report renders JSON-ready and Markdown output", () => {
  const resolved = resolveValidationCommands(
    inventory({
      projectTypes: ["node", "typescript"],
      files: ["package.json", "tsconfig.json"],
      manifests: ["package.json", "tsconfig.json"]
    })
  );

  const report = createPreviewValidationReport({
    repo: "ShannonBrayNC/echocode-platform",
    commands: resolved.commands,
    warnings: resolved.warnings,
    generatedAt: "2026-05-29T00:00:00Z"
  });

  assert.equal(report.mode, "preview");
  assert.equal(report.blocked, false);
  assert.equal(report.results.length, report.commands.length);
  assert.match(report.markdown, /EchoCodex Validation Report/);
  assert.match(report.markdown, /npm run build/);
});

test("failure classifier categorizes common validation failures", () => {
  assert.equal(classifyValidationFailure({ kind: "test", exitCode: 1, stderr: "AssertionError" }), "test-failure");
  assert.equal(classifyValidationFailure({ kind: "typecheck", exitCode: 2, stderr: "Type error" }), "typecheck-failure");
  assert.equal(classifyValidationFailure({ kind: "lint", exitCode: 1, stderr: "eslint failed" }), "lint-failure");
  assert.equal(classifyValidationFailure({ kind: "build", exitCode: 1, stderr: "build failed" }), "build-failure");
  assert.equal(classifyValidationFailure({ kind: "test", exitCode: 1, stderr: "Cannot find module" }), "dependency-install");
  assert.equal(classifyValidationFailure({ kind: "unknown", exitCode: 0 }), "none");
});
