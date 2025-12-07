#!/usr/bin/env node
import "dotenv/config";
import { mkdir } from "fs/promises";
import { join } from "path";
import { evaluatePR } from "./evaluator.js";

function printUsage(): void {
  console.log(`
PR Evaluator - Evaluate PostHog integration quality in pull requests

Usage:
  pnpm run evaluate --pr <number> [options]

Options:
  --pr, -p <number>       PR number to evaluate (required)
  --test-run [name]       Run evaluation without posting to GitHub, saves prompt and output to test-evaluations/<name>/
  --help, -h              Show this help message

Examples:
  pnpm run evaluate --pr 123
  pnpm run evaluate --pr 123 --test-run
  pnpm run evaluate --pr 123 --test-run my-test
`);
}

function parseArgs(args: string[]): {
  prNumber?: number;
  testRun: boolean;
  testRunName?: string;
  help: boolean;
} {
  const result = {
    prNumber: undefined as number | undefined,
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

  if (!args.prNumber || isNaN(args.prNumber)) {
    console.error("Error: --pr <number> is required\n");
    printUsage();
    process.exit(1);
  }

  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN;
  const hasValidToken = token && !token.startsWith("ghp_...") && token.length > 10;
  if (!hasValidToken && !args.testRun) {
    console.warn("Warning: GITHUB_TOKEN not set or invalid. Using --test-run mode (comment will not be posted).");
    args.testRun = true;
  }

  // Create test run directory if needed
  let testRunDir: string | undefined;
  if (args.testRun) {
    const dirName = args.testRunName || new Date().toISOString().replace(/[:.]/g, "-");
    testRunDir = join("test-evaluations", dirName);
    await mkdir(testRunDir, { recursive: true });
    console.log(`Test run directory: ${testRunDir}`);
  }

  try {
    const result = await evaluatePR({
      prNumber: args.prNumber,
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
