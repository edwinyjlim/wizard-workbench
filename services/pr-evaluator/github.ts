/**
 * PR Evaluator GitHub utilities
 *
 * Uses the shared github service for generic operations.
 * No GITHUB_TOKEN needed - gh CLI handles authentication.
 */

// Re-export types from shared github service
export type { PRData, PRFile } from "../github/index.js";

// Re-export gh auth check
export { isGhAuthenticated } from "../github/index.js";

// Import for local wrappers
import type { PRData } from "../github/index.js";
import {
  fetchPR as ghFetchPR,
  postPRComment as ghPostPRComment,
} from "../github/index.js";

/**
 * Fetch PR data by number.
 * Uses gh CLI - works without token for public repos.
 */
export function fetchPR(prNumber: number): PRData {
  const cwd = process.cwd();
  return ghFetchPR(prNumber, cwd);
}

/**
 * Post a comment on a PR.
 * Uses gh CLI - requires `gh auth login`.
 */
export function postPRComment(prNumber: number, comment: string): string {
  const cwd = process.cwd();
  return ghPostPRComment(prNumber, comment, cwd);
}
