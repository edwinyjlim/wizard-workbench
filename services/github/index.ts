/**
 * GitHub service - shared utilities for git and GitHub CLI operations
 */

// Git operations
export {
  git,
  gitSafe,
  getRepoRoot,
  getRemoteUrl,
  hasChanges,
  getChangedFiles,
  getCurrentBranch,
  branchExists,
  createBranch,
  checkout,
  deleteBranch,
  listBranches,
  commitAll,
  push,
  getMergeBase,
  getDiff,
  getDiffNumstat,
  getDiffNameStatus,
  getFileDiff,
  getCommitAuthor,
  getFirstCommitMessage,
  getCommitMessages,
} from "./git.js";

// GitHub CLI operations
export {
  createPR,
  fetchPR,
  postPRComment,
  getPRNumber,
  getPRUrl,
  isGhAuthenticated,
  type CreatePROptions,
} from "./gh-cli.js";

// Shared types
export type { PRData, PRFile } from "./types.js";
