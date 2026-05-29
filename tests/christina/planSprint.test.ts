import assert from "node:assert/strict";
import test from "node:test";

import { planSprint } from "../../src/christina/planSprint.js";
import { selectNextIssue } from "../../src/christina/selectNextIssue.js";
import type { RunnerIssue } from "../../src/github/types.js";
import type { RepoInventory } from "../../src/repo/RepoInventory.js";

const issueA: RunnerIssue = {
  repo: "ShannonBrayNC/echocode-platform",
  number: 40,
  title: "Build Christina sprint selector and execution planner",
  body: "Update src/christina/planSprint.ts and tests/christina/planSprint.test.ts",
  labels: ["echocodex"],
  priority: 100,
  updatedAt: "2026-05-29T05:00:00Z",
  url: "https://github.com/ShannonBrayNC/echocode-platform/issues/40",
  sourceSystem: "github"
};

const issueB: RunnerIssue = {
  repo: "ShannonBrayNC/OpsHelm",
  number: 1,
  title: "Lower priority task",
  body: "",
  labels: [],
  priority: 50,
  updatedAt: "2026-05-29T06:00:00Z",
  url: "https://github.com/ShannonBrayNC/OpsHelm/issues/1",
  sourceSystem: "github"
};

const inventory: RepoInventory = {
  repositoryName: "ShannonBrayNC/echocode-platform",
  projectTypes: ["node", "typescript", "mixed"],
  files: [
    "README.md",
    "package.json",
    "tsconfig.json",
    "src/christina/planSprint.ts",
    "src/christina/selectNextIssue.ts",
    "tests/christina/planSprint.test.ts"
  ],
  manifests: ["package.json", "tsconfig.json"],
  packageManagers: ["npm"],
  buildHints: ["npm run build"],
  testHints: ["npm test"],
  ciWorkflows: [],
  docs: ["README.md"],
  sensitivePaths: []
};

test("selector chooses highest-priority eligible issue", () => {
  const result = selectNextIssue({ issues: [issueB, issueA] });

  assert.equal(result.selectedIssue?.number, 40);
  assert.deepEqual(result.blockers, []);
});

test("selector honors explicit issue override", () => {
  const result = selectNextIssue({
    issues: [issueA, issueB],
    explicitIssue: {
      repo: "ShannonBrayNC/OpsHelm",
      number: 1
    }
  });

  assert.equal(result.selectedIssue?.repo, "ShannonBrayNC/OpsHelm");
  assert.equal(result.selectedIssue?.number, 1);
});

test("selector blocks labels configured as blocked", () => {
  const result = selectNextIssue({
    issues: [
      {
        ...issueA,
        labels: ["blocked"]
      }
    ],
    blockedLabels: ["blocked"]
  });

  assert.equal(result.selectedIssue, undefined);
  assert.equal(result.blockers[0].code, "all-issues-blocked");
});

test("planner creates deterministic dry-run sprint plan", () => {
  const plan = planSprint({
    issue: issueA,
    repoInventory: inventory,
    currentBranch: "main"
  });

  assert.equal(plan.mode, "dryRun");
  assert.equal(plan.ready, true);
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.validationCommands, ["npm run build", "npm run typecheck", "npm test"]);
  assert.deepEqual(plan.impactedFiles, ["src/christina/planSprint.ts", "tests/christina/planSprint.test.ts"]);
  assert.match(plan.markdown, /# Christina Sprint Plan/);
  assert.match(plan.markdown, /Build Christina sprint selector and execution planner/);
});

test("planner blocks missing tests", () => {
  const plan = planSprint({
    issue: issueA,
    repoInventory: {
      ...inventory,
      testHints: []
    },
    currentBranch: "main"
  });

  assert.equal(plan.ready, false);
  assert.equal(plan.blockers[0].code, "missing-tests");
});

test("planner blocks unsafe scope labels", () => {
  const plan = planSprint({
    issue: {
      ...issueA,
      labels: ["unsafe-live-write"]
    },
    repoInventory: inventory,
    currentBranch: "main"
  });

  assert.equal(plan.ready, false);
  assert.equal(plan.blockers[0].code, "unsafe-scope");
});
