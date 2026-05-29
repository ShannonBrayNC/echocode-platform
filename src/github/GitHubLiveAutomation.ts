import { Octokit } from "@octokit/rest";
import type { PolicyGateResult } from "../policy/EchoCodexPolicy.js";

export type LiveFileChange = {
  path: string;
  content: string;
  message: string;
  sha?: string;
};

export type LiveAutomationRequest = {
  repo: string;
  baseBranch: string;
  workingBranch: string;
  changes: LiveFileChange[];
  pullRequest?: {
    title: string;
    body?: string;
    draft?: boolean;
  };
};

export type LiveAutomationResult = {
  repo: string;
  baseBranch: string;
  workingBranch: string;
  committedPaths: string[];
  pullRequest?: {
    number: number;
    url: string;
    draft: boolean;
  };
};

export type GitHubAutomationClient = {
  createBranch(params: {
    repo: string;
    branch: string;
    baseBranch: string;
  }): Promise<void>;
  upsertFile(params: {
    repo: string;
    branch: string;
    path: string;
    content: string;
    message: string;
    sha?: string;
  }): Promise<void>;
  openPullRequest(params: {
    repo: string;
    headBranch: string;
    baseBranch: string;
    title: string;
    body?: string;
    draft: boolean;
  }): Promise<{ number: number; url: string; draft: boolean }>;
};

function splitRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    throw new Error(`Repository must be in owner/name format. Received: ${repo}`);
  }

  return { owner, name };
}

function assertPolicyAllowed(policyDecision: PolicyGateResult, operation: "createBranch" | "writeWorkspace" | "openPullRequest"): void {
  if (policyDecision.decision !== "allow") {
    throw new Error(`Policy gate did not allow ${operation}: ${policyDecision.reasons.map((reason) => reason.code).join(", ")}`);
  }

  if (operation === "createBranch" && policyDecision.effectiveMode !== "createBranch" && policyDecision.effectiveMode !== "openPullRequest") {
    throw new Error(`Policy mode ${policyDecision.effectiveMode} cannot create a branch.`);
  }

  if (operation === "writeWorkspace" && policyDecision.effectiveMode !== "writeWorkspace" && policyDecision.effectiveMode !== "openPullRequest") {
    throw new Error(`Policy mode ${policyDecision.effectiveMode} cannot write files.`);
  }

  if (operation === "openPullRequest" && policyDecision.effectiveMode !== "openPullRequest") {
    throw new Error(`Policy mode ${policyDecision.effectiveMode} cannot open a pull request.`);
  }
}

export class OctokitGitHubAutomationClient implements GitHubAutomationClient {
  private readonly octokit: Octokit;

  constructor(token: string) {
    if (!token.trim()) {
      throw new Error("A GitHub token is required for live automation.");
    }

    this.octokit = new Octokit({ auth: token });
  }

  async createBranch(params: { repo: string; branch: string; baseBranch: string }): Promise<void> {
    const { owner, name } = splitRepo(params.repo);
    const baseRef = await this.octokit.git.getRef({
      owner,
      repo: name,
      ref: `heads/${params.baseBranch}`
    });

    await this.octokit.git.createRef({
      owner,
      repo: name,
      ref: `refs/heads/${params.branch}`,
      sha: baseRef.data.object.sha
    });
  }

  async upsertFile(params: { repo: string; branch: string; path: string; content: string; message: string; sha?: string }): Promise<void> {
    const { owner, name } = splitRepo(params.repo);

    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo: name,
      path: params.path,
      branch: params.branch,
      message: params.message,
      content: Buffer.from(params.content, "utf8").toString("base64"),
      sha: params.sha
    });
  }

  async openPullRequest(params: { repo: string; headBranch: string; baseBranch: string; title: string; body?: string; draft: boolean }): Promise<{ number: number; url: string; draft: boolean }> {
    const { owner, name } = splitRepo(params.repo);
    const pull = await this.octokit.pulls.create({
      owner,
      repo: name,
      title: params.title,
      body: params.body,
      head: params.headBranch,
      base: params.baseBranch,
      draft: params.draft
    });

    return {
      number: pull.data.number,
      url: pull.data.html_url,
      draft: Boolean(pull.data.draft)
    };
  }
}

export async function executeLiveAutomation(params: {
  request: LiveAutomationRequest;
  policyDecision: PolicyGateResult;
  client: GitHubAutomationClient;
}): Promise<LiveAutomationResult> {
  const { request, policyDecision, client } = params;

  assertPolicyAllowed(policyDecision, request.pullRequest ? "openPullRequest" : "writeWorkspace");

  await client.createBranch({
    repo: request.repo,
    branch: request.workingBranch,
    baseBranch: request.baseBranch
  });

  for (const change of request.changes) {
    await client.upsertFile({
      repo: request.repo,
      branch: request.workingBranch,
      path: change.path,
      content: change.content,
      message: change.message,
      sha: change.sha
    });
  }

  const pullRequest = request.pullRequest
    ? await client.openPullRequest({
        repo: request.repo,
        headBranch: request.workingBranch,
        baseBranch: request.baseBranch,
        title: request.pullRequest.title,
        body: request.pullRequest.body,
        draft: request.pullRequest.draft ?? true
      })
    : undefined;

  return {
    repo: request.repo,
    baseBranch: request.baseBranch,
    workingBranch: request.workingBranch,
    committedPaths: request.changes.map((change) => change.path),
    pullRequest
  };
}
