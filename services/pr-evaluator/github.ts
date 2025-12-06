import { Octokit } from "@octokit/rest";

const OWNER = "PostHog";
const REPO = "wizard-workbench";

export interface PRData {
  number: number;
  title: string;
  description: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  diff: string;
  files: PRFile[];
}

export interface PRFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  patch?: string;
}

function isValidToken(token: string | undefined): token is string {
  // Check if token exists and is not a placeholder
  return !!token && !token.startsWith("ghp_...") && token.length > 10;
}

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  // Token is optional for fetching public repos, but required for posting comments
  return isValidToken(token) ? new Octokit({ auth: token }) : new Octokit();
}

export async function fetchPR(prNumber: number): Promise<PRData> {
  const octokit = getOctokit();

  // Fetch PR metadata
  const { data: pr } = await octokit.pulls.get({
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
  });

  // Fetch PR files
  const { data: filesData } = await octokit.pulls.listFiles({
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    per_page: 100,
  });

  // Fetch the diff
  const { data: diffData } = await octokit.pulls.get({
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });

  const files: PRFile[] = filesData.map((f) => ({
    filename: f.filename,
    status: f.status as PRFile["status"],
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch,
  }));

  return {
    number: pr.number,
    title: pr.title,
    description: pr.body || "",
    author: pr.user?.login || "unknown",
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    diff: diffData as unknown as string,
    files,
  };
}

export async function postPRComment(prNumber: number, comment: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!isValidToken(token)) {
    throw new Error("A valid GITHUB_TOKEN is required to post comments");
  }

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number: prNumber,
    body: comment,
  });

  return data.html_url;
}
