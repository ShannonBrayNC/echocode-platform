import assert from "node:assert/strict";
import test from "node:test";

import { scanRepository } from "../../src/repo/RepoScanner.js";

test("scanner detects TypeScript Node repository", () => {
  const inventory = scanRepository({
    repositoryName: "ShannonBrayNC/echocode-platform",
    fileTree: [
      "README.md",
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "src/context/RepoContextGate.ts",
      "tests/context/RepoContextGate.test.ts"
    ]
  });

  assert.deepEqual(inventory.projectTypes, ["node", "typescript", "mixed"]);
  assert.deepEqual(inventory.packageManagers, ["npm"]);
  assert.deepEqual(inventory.buildHints, ["npm run build"]);
  assert.deepEqual(inventory.testHints, ["npm test"]);
  assert.deepEqual(inventory.manifests, ["package.json", "tsconfig.json"]);
});

test("scanner detects Python repository", () => {
  const inventory = scanRepository({
    fileTree: ["pyproject.toml", "requirements.txt", "tests/test_app.py"]
  });

  assert.ok(inventory.projectTypes.includes("python"));
  assert.deepEqual(inventory.packageManagers, ["pip", "python-project"]);
  assert.ok(inventory.testHints.includes("pytest"));
});

test("scanner detects PowerShell repository", () => {
  const inventory = scanRepository({
    fileTree: ["tools/Invoke-ChristinaSprintRunner.ps1", "tests/Runner.Tests.ps1"]
  });

  assert.ok(inventory.projectTypes.includes("powershell"));
  assert.ok(inventory.testHints.includes("Invoke-Pester"));
});

test("scanner flags sensitive paths without reading values", () => {
  const inventory = scanRepository({
    fileTree: [".env", "certs/app.pfx", "config/token-cache.json", "src/index.ts"]
  });

  assert.equal(inventory.sensitivePaths.length, 3);
  assert.deepEqual(
    inventory.sensitivePaths.map((finding) => finding.path),
    [".env", "certs/app.pfx", "config/token-cache.json"]
  );
});
