import { execSync } from "child_process";
import type { PRData, PRFile } from "./github.js";

export interface LocalBranchOptions {
  branch: string;
  baseBranch?: string; // defaults to 'main'
  cwd?: string; // defaults to process.cwd()
}

export async function fetchLocalBranch(options: LocalBranchOptions): Promise<PRData> {
  const { branch, baseBranch = "main", cwd = process.cwd() } = options;

  const execOpts = { cwd, encoding: "utf-8" as const };

  // Get the current branch if "HEAD" is specified
  const actualBranch = branch === "HEAD"
    ? execSync("git rev-parse --abbrev-ref HEAD", execOpts).trim()
    : branch;

  // Get the merge base (common ancestor)
  const mergeBase = execSync(`git merge-base ${baseBranch} ${actualBranch}`, execOpts).trim();

  // Get diff
  const diff = execSync(`git diff ${mergeBase}...${actualBranch}`, execOpts);

  // Get file stats using diff --stat
  const diffStat = execSync(`git diff --numstat ${mergeBase}...${actualBranch}`, execOpts);

  // Get file statuses
  const diffNameStatus = execSync(`git diff --name-status ${mergeBase}...${actualBranch}`, execOpts);

  // Parse file information
  const files = parseGitFiles(diffStat, diffNameStatus, mergeBase, actualBranch, cwd);

  // Try to get author from the most recent commit on the branch
  let author = "local";
  try {
    author = execSync(`git log -1 --format=%an ${actualBranch}`, execOpts).trim();
  } catch {
    // Ignore errors, use default
  }

  // Try to get a title from the first commit message after the merge base
  let title = `Local branch: ${actualBranch}`;
  try {
    const firstCommitMsg = execSync(
      `git log --format=%s ${mergeBase}..${actualBranch} --reverse | head -1`,
      execOpts
    ).trim();
    if (firstCommitMsg) {
      title = firstCommitMsg;
    }
  } catch {
    // Ignore errors, use default
  }

  // Try to get description from commit messages
  let description = "";
  try {
    const commitMessages = execSync(
      `git log --format="- %s" ${mergeBase}..${actualBranch}`,
      execOpts
    ).trim();
    if (commitMessages) {
      description = `Commits:\n${commitMessages}`;
    }
  } catch {
    // Ignore errors
  }

  return {
    number: 0, // Local branches don't have PR numbers
    title,
    description,
    author,
    baseBranch,
    headBranch: actualBranch,
    diff,
    files,
  };
}

function parseGitFiles(
  diffStat: string,
  diffNameStatus: string,
  mergeBase: string,
  branch: string,
  cwd: string
): PRFile[] {
  const files: PRFile[] = [];

  // Parse numstat for additions/deletions
  const statLines = diffStat.trim().split("\n").filter(Boolean);
  const statsMap = new Map<string, { additions: number; deletions: number }>();

  for (const line of statLines) {
    const [additions, deletions, filename] = line.split("\t");
    // Binary files show "-" for additions/deletions
    statsMap.set(filename, {
      additions: additions === "-" ? 0 : parseInt(additions, 10),
      deletions: deletions === "-" ? 0 : parseInt(deletions, 10),
    });
  }

  // Parse name-status for file status
  const statusLines = diffNameStatus.trim().split("\n").filter(Boolean);

  for (const line of statusLines) {
    const [statusCode, ...filenameParts] = line.split("\t");
    const filename = filenameParts[filenameParts.length - 1]; // Handle renames (old\tnew)

    let status: PRFile["status"];
    switch (statusCode[0]) {
      case "A":
        status = "added";
        break;
      case "D":
        status = "removed";
        break;
      case "R":
        status = "renamed";
        break;
      default:
        status = "modified";
    }

    const stats = statsMap.get(filename) || { additions: 0, deletions: 0 };

    // Get the patch for this file
    let patch: string | undefined;
    try {
      patch = execSync(`git diff ${mergeBase}...${branch} -- "${filename}"`, {
        cwd,
        encoding: "utf-8",
      });
    } catch {
      // Ignore errors
    }

    files.push({
      filename,
      status,
      additions: stats.additions,
      deletions: stats.deletions,
      patch,
    });
  }

  return files;
}
