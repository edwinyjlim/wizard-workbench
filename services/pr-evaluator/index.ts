#!/usr/bin/env node
import "dotenv/config";
import { mkdir } from "fs/promises";
import { join } from "path";
import { evaluatePR } from "./evaluator.js";
import { fetchLocalBranch } from "./git-local.js";

function printUsage(): void {
  console.log(`
PR Evaluator - Evaluate PostHog integration quality in pull requests or local branches

Usage:
  pnpm run evaluate --pr <number> [options]
  pnpm run evaluate --branch <name> [options]

Options:
  --pr, -p <number>       PR number to evaluate (from GitHub)
  --branch, -b <name>     Local branch to evaluate (use "HEAD" for current branch)
  --base <branch>         Base branch for comparison (default: main)
  --test-run [name]       Run evaluation without posting to GitHub, saves prompt and output to test-evaluations/<name>/
  --help, -h              Show this help message

Examples:
  pnpm run evaluate --pr 123
  pnpm run evaluate --pr 123 --test-run
  pnpm run evaluate --branch feature/my-feature
  pnpm run evaluate --branch HEAD --base develop
  pnpm run evaluate -b HEAD --test-run
`);
}

function parseArgs(args: string[]): {
  prNumber?: number;
  branch?: string;
  baseBranch: string;
  testRun: boolean;
  testRunName?: string;
  help: boolean;
} {
  const result = {
    prNumber: undefined as number | undefined,
    branch: undefined as string | undefined,
    baseBranch: "main",
    testRun: false,
    testRunName: undefined as string | undefined,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--test-run") {
      result.testRun = true;
      // Check if next arg is a name (not another flag)
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        result.testRunName = nextArg;
        i++;
      }
    } else if (arg === "--pr" || arg === "-p") {
      const value = args[++i];
      if (value) {
        result.prNumber = parseInt(value, 10);
      }
    } else if (arg === "--branch" || arg === "-b") {
      const value = args[++i];
      if (value) {
        result.branch = value;
      }
    } else if (arg === "--base") {
      const value = args[++i];
      if (value) {
        result.baseBranch = value;
      }
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // Validate that either --pr or --branch is provided
  const hasPr = args.prNumber && !isNaN(args.prNumber);
  const hasBranch = !!args.branch;

  if (!hasPr && !hasBranch) {
    console.error("Error: Either --pr <number> or --branch <name> is required\n");
    printUsage();
    process.exit(1);
  }

  if (hasPr && hasBranch) {
    console.error("Error: Cannot use both --pr and --branch. Choose one.\n");
    printUsage();
    process.exit(1);
  }

  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  // For local branch mode, always use test-run (can't post to GitHub without a PR)
  if (hasBranch && !args.testRun) {
    console.log("Note: Local branch mode always uses --test-run (no PR to post comments to).");
    args.testRun = true;
  }

  // For PR mode, check GitHub token
  if (hasPr) {
    const token = process.env.GITHUB_TOKEN;
    const hasValidToken = token && !token.startsWith("ghp_...") && token.length > 10;
    if (!hasValidToken && !args.testRun) {
      console.warn("Warning: GITHUB_TOKEN not set or invalid. Using --test-run mode (comment will not be posted).");
      args.testRun = true;
    }
  }

  // Create test run directory if needed
  let testRunDir: string | undefined;
  if (args.testRun) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let dirName: string;
    if (args.testRunName) {
      dirName = args.testRunName;
    } else if (hasPr) {
      dirName = `pr-${args.prNumber}-${timestamp}`;
    } else {
      // For branches, sanitize the branch name (replace / with -)
      const safeBranchName = args.branch!.replace(/\//g, "-");
      dirName = `branch-${safeBranchName}-${timestamp}`;
    }
    testRunDir = join("test-evaluations", dirName);
    await mkdir(testRunDir, { recursive: true });
    console.log(`Test run directory: ${testRunDir}`);
  }

  try {
    // Fetch PR data from GitHub or local git
    let prData;
    if (hasPr) {
      const { fetchPR } = await import("./github.js");
      console.log(`Fetching PR #${args.prNumber} from GitHub...`);
      prData = await fetchPR(args.prNumber!);
    } else {
      console.log(`Fetching local branch "${args.branch}" (base: ${args.baseBranch})...`);
      prData = await fetchLocalBranch({
        branch: args.branch!,
        baseBranch: args.baseBranch,
      });
    }

    console.log(`Title: "${prData.title}" by ${prData.author}`);
    console.log(`Branch: ${prData.headBranch} → ${prData.baseBranch}`);
    console.log(`Files changed: ${prData.files.length}`);

    const result = await evaluatePR({
      prData,
      testRun: args.testRun,
      testRunDir,
    });

    console.log("\n=== Evaluation Complete ===");
    if (result.commentUrl) {
      console.log(`Comment URL: ${result.commentUrl}`);
    }
    if (testRunDir) {
      console.log(`Files saved to: ${testRunDir}`);
    }
  } catch (error) {
    console.error("Error during evaluation:", error);
    process.exit(1);
  }
}

main();
