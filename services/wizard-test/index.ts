#!/usr/bin/env node
/**
 * wizard-test: Run wizard on test apps and optionally create PRs
 *
 * Usage:
 *   pnpm wizard-test                              # Interactive selection
 *   pnpm wizard-test --app next-js/15-app-router-saas
 *   pnpm wizard-test --app next-js/15-app-router-saas --local
 *   pnpm wizard-test --all --local
 */
import "dotenv/config";
import { createInterface } from "readline";
import { join } from "path";
import {
  findApps,
  resetApp,
  hasChanges,
  getChangedFiles,
  runWizard,
  createBranch,
  commitAll,
  push,
  createPR,
  checkout,
  getCurrentBranch,
  getRepoRoot,
  getRemoteUrl,
  deleteBranch,
  listBranches,
  branchExists,
  formatMs,
  timestamp,
  type App,
} from "./utils.js";

// ============================================================================
// Config
// ============================================================================

const WORKBENCH = join(import.meta.dirname, "../..");
const APPS_DIR = join(WORKBENCH, "apps");

interface Options {
  app?: string;
  all: boolean;
  local: boolean;
  base: string;
  remote: string;
  deleteBranch: boolean;
  clean: boolean;
  reuseBranch?: string;
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = {
    all: false,
    local: false,
    base: "main",
    remote: "origin",
    deleteBranch: false,
    clean: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--app" || arg === "-a") opts.app = args[++i];
    else if (arg === "--all") opts.all = true;
    else if (arg === "--local" || arg === "-l") opts.local = true;
    else if (arg === "--base") opts.base = args[++i];
    else if (arg === "--remote" || arg === "-r") opts.remote = args[++i];
    else if (arg === "--delete-branch" || arg === "-d") opts.deleteBranch = true;
    else if (arg === "--clean") opts.clean = true;
    else if (arg === "--reuse-branch" || arg === "-b") opts.reuseBranch = args[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(`
wizard-test: Run wizard on test apps and create PRs

Usage:
  pnpm wizard-test                     Interactive app selection
  pnpm wizard-test --app <name>        Test specific app
  pnpm wizard-test --all               Test all apps
  pnpm wizard-test --local             Skip PR creation
  pnpm wizard-test --base <branch>     Base branch for PR (default: main)
  pnpm wizard-test --remote <name>     Git remote to push to (default: origin)

Branch Management:
  pnpm wizard-test --delete-branch     Delete local branch after push
  pnpm wizard-test --clean             Delete old wizard-test branches
  pnpm wizard-test --reuse-branch <n>  Reuse existing branch instead of creating new
`);
      process.exit(0);
    }
  }
  return opts;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectApp(apps: App[]): Promise<App> {
  console.log("\nAvailable apps:\n");
  apps.forEach((app, i) => console.log(`  ${i + 1}) ${app.name}`));
  const choice = await prompt(`\nSelect app (1-${apps.length}): `);
  const index = parseInt(choice, 10) - 1;
  if (index < 0 || index >= apps.length) {
    console.error("Invalid selection");
    process.exit(1);
  }
  return apps[index];
}

// ============================================================================
// Branch management
// ============================================================================

async function cleanBranches(): Promise<void> {
  const repoRoot = getRepoRoot(WORKBENCH);
  const branches = listBranches(repoRoot, "wizard-test/*");

  if (branches.length === 0) {
    console.log("No wizard-test branches found.\n");
    return;
  }

  console.log(`\nFound ${branches.length} wizard-test branch(es):\n`);
  branches.forEach((branch, i) => console.log(`  ${i + 1}) ${branch}`));

  const answer = await prompt(`\nDelete all ${branches.length} branch(es)? (y/n): `);
  if (answer.toLowerCase() !== "y") {
    console.log("Cancelled.\n");
    return;
  }

  let deleted = 0;
  for (const branch of branches) {
    try {
      deleteBranch(repoRoot, branch);
      console.log(`  Deleted: ${branch}`);
      deleted++;
    } catch (e) {
      console.error(`  Failed to delete ${branch}: ${e}`);
    }
  }

  console.log(`\nDeleted ${deleted}/${branches.length} branch(es).\n`);
}

// ============================================================================
// Test flow
// ============================================================================

async function testApp(app: App, opts: Options): Promise<boolean> {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Testing: ${app.name}`);
  console.log(`${"─".repeat(50)}\n`);

  // 1. Reset (with confirmation)
  console.log("[1/5] Reset app to clean state");
  console.log(`      Path: ${app.path}\n`);

  const changedFiles = getChangedFiles(app.path);
  if (changedFiles.length > 0) {
    console.log(`      WARNING: This will discard ${changedFiles.length} uncommitted change(s):\n`);
    for (const file of changedFiles) {
      console.log(`        ${file}`);
    }
    console.log();

    const confirm = await prompt("      Proceed with git restore? (y/n): ");
    if (confirm.toLowerCase() !== "y") {
      console.log("      Skipped\n");
      return false;
    }
  } else {
    console.log("      No uncommitted changes found\n");
  }

  try {
    resetApp(app.path);
    console.log("      Done\n");
  } catch (e) {
    console.error(`      Failed: ${e}`);
    return false;
  }

  // 2. Run wizard
  console.log("[2/5] Running wizard...\n");
  const result = await runWizard(app.path);
  console.log();

  if (!result.success) {
    console.error(`      Failed: ${result.error}`);
    return false;
  }
  console.log(`      Completed in ${formatMs(result.duration)}\n`);

  // 3. Check changes
  console.log("[3/5] Checking changes...");
  if (!hasChanges(app.path)) {
    console.log("      No changes detected\n");
    return true;
  }
  console.log("      Changes detected\n");

  // Stop here if local mode
  if (opts.local) {
    console.log("[LOCAL] Skipping branch/PR creation\n");
    return true;
  }

  // 4. Create branch and commit
  console.log("[4/5] Creating branch and committing...");
  const repoRoot = getRepoRoot(WORKBENCH);
  const originalBranch = getCurrentBranch(repoRoot);

  // Determine branch name: reuse existing or create new
  let branchName: string;
  let reusedBranch = false;

  if (opts.reuseBranch) {
    if (branchExists(repoRoot, opts.reuseBranch)) {
      branchName = opts.reuseBranch;
      reusedBranch = true;
      console.log(`      Reusing branch: ${branchName}`);
    } else {
      console.log(`      Branch not found: ${opts.reuseBranch}`);
      console.log(`      Creating new branch instead`);
      branchName = `wizard-test/${app.name.replace(/\//g, "-")}/${timestamp()}`;
    }
  } else {
    branchName = `wizard-test/${app.name.replace(/\//g, "-")}/${timestamp()}`;
  }

  try {
    if (reusedBranch) {
      checkout(repoRoot, branchName);
    } else {
      createBranch(repoRoot, branchName);
    }
    const hash = commitAll(repoRoot, `wizard-test: ${app.name}`);
    console.log(`      Branch: ${branchName}`);
    console.log(`      Commit: ${hash}\n`);
  } catch (e) {
    console.error(`      Failed: ${e}`);
    checkout(repoRoot, originalBranch);
    return false;
  }

  // 5. Push and create PR
  console.log("[5/5] Pushing and creating PR...");
  const remoteUrl = getRemoteUrl(repoRoot, opts.remote);
  console.log(`      Remote: ${opts.remote} (${remoteUrl})`);

  try {
    push(repoRoot, branchName, opts.remote);
    const prUrl = createPR(
      repoRoot,
      `[Wizard Test] ${app.name}`,
      `Automated wizard test on \`${app.name}\`\n\nDuration: ${formatMs(result.duration)}`,
      opts.base
    );
    console.log(`      PR: ${prUrl}\n`);

    // Delete local branch after successful push if requested
    if (opts.deleteBranch) {
      checkout(repoRoot, originalBranch);
      try {
        deleteBranch(repoRoot, branchName);
        console.log(`      Deleted local branch: ${branchName}\n`);
      } catch (e) {
        console.error(`      Failed to delete branch: ${e}`);
      }
      return true;
    }
  } catch (e) {
    console.error(`      Failed: ${e}`);
  }

  // Return to original branch
  checkout(repoRoot, originalBranch);
  return true;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const opts = parseArgs();

  // Handle --clean command
  if (opts.clean) {
    await cleanBranches();
    return;
  }

  const apps = findApps(APPS_DIR);

  if (apps.length === 0) {
    console.error("No apps found");
    process.exit(1);
  }

  // Determine which apps to test
  let targets: App[];

  if (opts.all) {
    targets = apps;
  } else if (opts.app) {
    const app = apps.find((a) => a.name === opts.app || a.name.endsWith(opts.app!));
    if (!app) {
      console.error(`App not found: ${opts.app}`);
      console.log("Available:", apps.map((a) => a.name).join(", "));
      process.exit(1);
    }
    targets = [app];
  } else {
    targets = [await selectApp(apps)];
  }

  // Run tests
  console.log(`\nWizard Test`);
  console.log(`Apps: ${targets.length}`);
  console.log(`Mode: ${opts.local ? "local" : "create PR"}`);

  let passed = 0;
  for (const app of targets) {
    if (await testApp(app, opts)) passed++;
  }

  // Summary
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Results: ${passed}/${targets.length} passed`);
  console.log(`${"═".repeat(50)}\n`);

  process.exit(passed === targets.length ? 0 : 1);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
