/**
 * Generic git utilities for local repository operations
 */
import { execSync } from "child_process";

// ============================================================================
// Low-level git commands
// ============================================================================

export function git(cmd: string, cwd: string): string {
  return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", stdio: "pipe" }).trim();
}

export function gitSafe(cmd: string, cwd: string): string | null {
  try {
    return git(cmd, cwd);
  } catch {
    return null;
  }
}

// ============================================================================
// Repository utilities
// ============================================================================

export function getRepoRoot(cwd: string): string {
  return git("rev-parse --show-toplevel", cwd);
}

export function getRemoteUrl(cwd: string, remote: string = "origin"): string | null {
  return gitSafe(`remote get-url ${remote}`, cwd);
}

export function hasChanges(cwd: string): boolean {
  const status = gitSafe("status --porcelain", cwd);
  return status !== null && status.length > 0;
}

export function getChangedFiles(cwd: string): string[] {
  const status = gitSafe("status --porcelain", cwd);
  if (!status) return [];
  return status.split("\n").filter((line) => line.length > 0);
}

// ============================================================================
// Branch utilities
// ============================================================================

export function getCurrentBranch(cwd: string): string {
  return git("branch --show-current", cwd);
}

export function branchExists(cwd: string, branch: string): boolean {
  const result = gitSafe(`rev-parse --verify "${branch}"`, cwd);
  return result !== null;
}

export function createBranch(cwd: string, name: string): void {
  git(`checkout -b "${name}"`, cwd);
}

export function checkout(cwd: string, branch: string): void {
  git(`checkout "${branch}"`, cwd);
}

export function deleteBranch(cwd: string, branch: string): void {
  git(`branch -D "${branch}"`, cwd);
}

export function listBranches(cwd: string, pattern?: string): string[] {
  const cmd = pattern ? `branch --list "${pattern}"` : "branch --list";
  const result = gitSafe(cmd, cwd);
  if (!result) return [];
  return result
    .split("\n")
    .map((line) => line.replace(/^\*?\s+/, "").trim())
    .filter((line) => line.length > 0);
}

// ============================================================================
// Commit and push utilities
// ============================================================================

export function commitAll(cwd: string, message: string): string {
  git("add -A", cwd);
  git(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
  return git("rev-parse --short HEAD", cwd);
}

export function push(cwd: string, branch: string, remote: string = "origin"): void {
  git(`push -u ${remote} "${branch}"`, cwd);
}

// ============================================================================
// Diff utilities (for pr-evaluator)
// ============================================================================

export function getMergeBase(cwd: string, baseBranch: string, headBranch: string): string {
  return git(`merge-base ${baseBranch} ${headBranch}`, cwd);
}

export function getDiff(cwd: string, from: string, to: string): string {
  return execSync(`git diff ${from}...${to}`, { cwd, encoding: "utf-8" });
}

export function getDiffNumstat(cwd: string, from: string, to: string): string {
  return execSync(`git diff --numstat ${from}...${to}`, { cwd, encoding: "utf-8" });
}

export function getDiffNameStatus(cwd: string, from: string, to: string): string {
  return execSync(`git diff --name-status ${from}...${to}`, { cwd, encoding: "utf-8" });
}

export function getFileDiff(cwd: string, from: string, to: string, filename: string): string | null {
  try {
    return execSync(`git diff ${from}...${to} -- "${filename}"`, { cwd, encoding: "utf-8" });
  } catch {
    return null;
  }
}

export function getCommitAuthor(cwd: string, ref: string): string | null {
  return gitSafe(`log -1 --format=%an ${ref}`, cwd);
}

export function getFirstCommitMessage(cwd: string, from: string, to: string): string | null {
  return gitSafe(`log --format=%s ${from}..${to} --reverse | head -1`, cwd);
}

export function getCommitMessages(cwd: string, from: string, to: string): string | null {
  return gitSafe(`log --format="- %s" ${from}..${to}`, cwd);
}
