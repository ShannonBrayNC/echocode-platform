import type { FileChange, ProposedPatch } from "./PatchModel.js";

function normalizeLines(content: string | undefined): string[] {
  if (content === undefined || content.length === 0) {
    return [];
  }

  return content.replace(/\r\n/g, "\n").split("\n");
}

function renderChangeHeader(change: FileChange): string[] {
  const oldPath = change.action === "create" ? "/dev/null" : `a/${change.path}`;
  const newPath = change.action === "delete" ? "/dev/null" : `b/${change.newPath ?? change.path}`;

  return [
    `diff --git a/${change.path} b/${change.newPath ?? change.path}`,
    `--- ${oldPath}`,
    `+++ ${newPath}`
  ];
}

function renderBody(change: FileChange): string[] {
  if (change.action === "noop") {
    return ["@@ -0,0 +0,0 @@", "# no-op change"];
  }

  const beforeLines = normalizeLines(change.before);
  const afterLines = normalizeLines(change.after);
  const beforeCount = beforeLines.length;
  const afterCount = afterLines.length;
  const lines = [`@@ -1,${beforeCount} +1,${afterCount} @@`];

  if (change.action === "delete") {
    return [...lines, ...beforeLines.map((line) => `-${line}`)];
  }

  if (change.action === "create") {
    return [...lines, ...afterLines.map((line) => `+${line}`)];
  }

  return [
    ...lines,
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`)
  ];
}

export function renderFileChangeDiff(change: FileChange): string {
  return [...renderChangeHeader(change), ...renderBody(change)].join("\n");
}

export function renderUnifiedDiff(patch: ProposedPatch): string {
  const header = [
    `# EchoCodex patch preview`,
    `# Issue: ${patch.issue.repo}#${patch.issue.number}`,
    `# Rationale: ${patch.rationale}`
  ];

  return [
    ...header,
    ...patch.changes.map(renderFileChangeDiff)
  ].join("\n");
}
