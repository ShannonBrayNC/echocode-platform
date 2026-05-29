import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRepoContext } from "../../src/context/RepoContextGate.js";

test("repo context gate reports missing repository name", () => {
  const result = evaluateRepoContext({
    fileTree: ["README.md"],
    issueObjective: "Implement issue #37"
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingInputs, ["repositoryName"]);
  assert.match(result.recommendedNextPrompt ?? "", /repositoryName/);
});

test("repo context gate reports missing file tree", () => {
  const result = evaluateRepoContext({
    repositoryName: "ShannonBrayNC/echocode-platform",
    issueObjective: "Implement issue #37"
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingInputs, ["fileTree"]);
});

test("repo context gate reports missing issue objective", () => {
  const result = evaluateRepoContext({
    repositoryName: "ShannonBrayNC/echocode-platform",
    fileTree: ["README.md"]
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingInputs, ["issueObjective"]);
});

test("repo context gate is ready with required context", () => {
  const result = evaluateRepoContext({
    repositoryName: "ShannonBrayNC/echocode-platform",
    currentBranch: "main",
    fileTree: ["README.md", "package.json", "src/context/RepoContextGate.ts"],
    packageMetadata: { type: "module" },
    testCommands: ["npm test"],
    buildCommands: ["npm run build"],
    issueObjective: "Implement issue #37",
    issueNumber: 37
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingInputs, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.recommendedNextPrompt, undefined);
});

test("repo context gate warns when optional validation metadata is absent", () => {
  const result = evaluateRepoContext({
    repositoryName: "ShannonBrayNC/echocode-platform",
    fileTree: ["README.md"],
    issueObjective: "Implement issue #37"
  });

  assert.equal(result.ready, true);
  assert.deepEqual(
    result.warnings.map((warning) => warning.code),
    [
      "missing-current-branch",
      "missing-package-metadata",
      "missing-test-commands",
      "missing-build-commands"
    ]
  );
});
