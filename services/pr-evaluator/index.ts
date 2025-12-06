#!/usr/bin/env node
import "dotenv/config";
import { evaluatePR } from "./evaluator.js";

function printUsage(): void {
  console.log(`
PR Evaluator - Evaluate PostHog integration quality in pull requests

Usage:
  pnpm run evaluate --pr <number> [options]

Options:
  --pr, -p <number>     PR number to evaluate (required)
  --dry-run             Preview comment without posting to GitHub
  --output, -o <file>   Save evaluation to markdown file
  --help, -h            Show this help message

Examples:
  pnpm run evaluate --pr 123
  pnpm run evaluate --pr 123 --dry-run
  pnpm run evaluate --pr 123 --output evaluation.md
  pnpm run evaluate --pr 123 --output evaluation.md --dry-run
`);
}

function parseArgs(args: string[]): { prNumber?: number; dryRun: boolean; outputFile?: string; help: boolean } {
  const result = { prNumber: undefined as number | undefined, dryRun: false, outputFile: undefined as string | undefined, help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--pr" || arg === "-p") {
      const value = args[++i];
      if (value) {
        result.prNumber = parseInt(value, 10);
      }
    } else if (arg === "--output" || arg === "-o") {
      result.outputFile = args[++i];
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
  if (!hasValidToken && !args.dryRun) {
    console.warn("Warning: GITHUB_TOKEN not set or invalid. Using --dry-run mode (comment will not be posted).");
    args.dryRun = true;
  }

  try {
    const result = await evaluatePR({
      prNumber: args.prNumber,
      dryRun: args.dryRun,
      outputFile: args.outputFile,
    });

    console.log("\n=== Evaluation Complete ===");
    console.log(`Overall Score: ${result.evaluation.overallScore}/10`);
    console.log(`Recommendation: ${result.evaluation.recommendation}`);
    if (result.commentUrl) {
      console.log(`Comment URL: ${result.commentUrl}`);
    }
  } catch (error) {
    console.error("Error during evaluation:", error);
    process.exit(1);
  }
}

main();
