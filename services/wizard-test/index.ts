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
import { join, relative } from "path";
import {
  findApps,
  resetApp,
  hasChanges,
  getChangedFiles,
  hasChangesInPath,
  getChangedFilesInPath,
  runWizard,
  commitPath,
  checkout,
  getCurrentBranch,
  getRepoRoot,
  getRemoteUrl,
  listBranches,
  pushAndCreatePR,
  switchOrCreateBranch,
  deleteBranches,
  formatMs,
  timestamp,
  extractPRNumber,
  runEvaluator,
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
  pushOnly: boolean;
  branch?: string;
  evaluate: boolean;
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
    pushOnly: false,
    evaluate: false,
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
    else if (arg === "--push-only" || arg === "-p") opts.pushOnly = true;
    else if (arg === "--branch") opts.branch = args[++i];
    else if (arg === "--evaluate" || arg === "-e") opts.evaluate = true;
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
  pnpm wizard-test --push-only         Skip reset/wizard, just push and create PR
  pnpm wizard-test --branch <name>     Branch to push (with --push-only, default: current)

Evaluation:
  pnpm wizard-test --evaluate, -e      Run pr-evaluator after PR creation
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

  const { deleted, failed } = deleteBranches(repoRoot, branches);
  for (const branch of branches.filter((b) => !failed.includes(b))) {
    console.log(`  Deleted: ${branch}`);
  }
  for (const branch of failed) {
    console.error(`  Failed to delete: ${branch}`);
  }

  console.log(`\nDeleted ${deleted}/${branches.length} branch(es).\n`);
}

// ============================================================================
// Push-only mode
// ============================================================================

async function pushOnlyMode(opts: Options): Promise<void> {
  const repoRoot = getRepoRoot(WORKBENCH);
  const originalBranch = getCurrentBranch(repoRoot);

  // Determine which branch to push
  const targetBranch = opts.branch || originalBranch;

  // Switch to target branch if specified and different from current
  if (opts.branch && opts.branch !== originalBranch) {
    try {
      checkout(repoRoot, opts.branch);
    } catch (e) {
      console.error(`\nError: Branch "${opts.branch}" not found.`);
      process.exit(1);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Push-only mode`);
  console.log(`${"─".repeat(50)}\n`);

  console.log(`      Branch: ${targetBranch}`);
  console.log(`      Base: ${opts.base}`);

  if (targetBranch === opts.base) {
    console.error(`\nError: Target branch is the base branch (${opts.base}).`);
    console.error("Specify a different branch with --branch.\n");
    if (opts.branch && opts.branch !== originalBranch) {
      checkout(repoRoot, originalBranch);
    }
    process.exit(1);
  }

  // Check for uncommitted changes
  if (hasChanges(repoRoot)) {
    console.log("\n      WARNING: You have uncommitted changes.\n");
    const changedFiles = getChangedFiles(repoRoot);
    for (const file of changedFiles) {
      console.log(`        ${file}`);
    }
    const confirm = await prompt("\n      Continue anyway? (y/n): ");
    if (confirm.toLowerCase() !== "y") {
      console.log("      Cancelled.\n");
      return;
    }
  }

  // Push and create PR
  console.log("\n[1/2] Pushing to remote...");
  const remoteUrl = getRemoteUrl(repoRoot, opts.remote);
  console.log(`      Remote: ${opts.remote} (${remoteUrl})`);

  const result = pushAndCreatePR({
    repoRoot,
    branch: targetBranch,
    remote: opts.remote,
    base: opts.base,
    title: `[Wizard Test] ${targetBranch}`,
    body: `Automated wizard test\n\nBranch: \`${targetBranch}\``,
    deleteBranchAfter: opts.deleteBranch,
    returnToBranch: originalBranch,
  });

  if (!result.success) {
    console.error(`      ${result.error}`);
    if (opts.branch && opts.branch !== originalBranch) {
      checkout(repoRoot, originalBranch);
    }
    process.exit(1);
  }

  console.log(`      Pushed: ${targetBranch}\n`);
  console.log("[2/2] Creating PR...");
  console.log(`      PR: ${result.prUrl}\n`);

  // Run evaluation if requested
  if (opts.evaluate && result.prUrl) {
    const prNumber = extractPRNumber(result.prUrl);
    if (prNumber) {
      console.log("[3/3] Running PR evaluation...");
      console.log(`      PR #${prNumber}\n`);
      const evalResult = await runEvaluator(prNumber);
      if (!evalResult.success) {
        console.warn(`      Evaluation failed: ${evalResult.error}\n`);
      } else {
        console.log(`      Evaluation complete\n`);
      }
    } else {
      console.warn(`      Could not extract PR number from URL: ${result.prUrl}\n`);
    }
  }

  if (opts.deleteBranch) {
    console.log(`      Deleted local branch: ${targetBranch}\n`);
  } else if (opts.branch && opts.branch !== originalBranch) {
    // Return to original branch if we switched
    checkout(repoRoot, originalBranch);
  }

  console.log(`${"═".repeat(50)}`);
  console.log(`Done`);
  console.log(`${"═".repeat(50)}\n`);
}

// ============================================================================
// Test flow
// ============================================================================

async function testApp(app: App, opts: Options): Promise<boolean> {
  const repoRoot = getRepoRoot(WORKBENCH);
  const appRelativePath = relative(repoRoot, app.path);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Testing: ${app.name}`);
  console.log(`${"─".repeat(50)}\n`);

  // 1. Reset app only (with confirmation)
  console.log("[1/5] Reset app to clean state");
  console.log(`      Path: ${app.path}\n`);

  const changedFiles = getChangedFilesInPath(repoRoot, appRelativePath);
  if (changedFiles.length > 0) {
    console.log(`      WARNING: This will discard ${changedFiles.length} uncommitted change(s) in ${app.name}:\n`);
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
    console.log("      No uncommitted changes in app\n");
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

  // 3. Check changes in app directory only
  console.log("[3/5] Checking changes...");
  if (!hasChangesInPath(repoRoot, appRelativePath)) {
    console.log("      No changes detected\n");
    return true;
  }
  console.log("      Changes detected\n");

  // Stop here if local mode
  if (opts.local) {
    console.log("[LOCAL] Skipping branch/PR creation\n");
    return true;
  }

  // 4. Create branch and commit only app files
  console.log("[4/5] Creating branch and committing...");
  const originalBranch = getCurrentBranch(repoRoot);

  // Switch to existing or create new branch
  const generateBranchName = () => `wizard-test/${app.name.replace(/\//g, "-")}/${timestamp()}`;
  let branchResult;
  try {
    branchResult = switchOrCreateBranch({
      repoRoot,
      branchName: opts.reuseBranch,
      generateName: generateBranchName,
    });
    if (!branchResult.created) {
      console.log(`      Reusing branch: ${branchResult.branch}`);
    }
  } catch (e) {
    console.error(`      Failed to switch/create branch: ${e}`);
    checkout(repoRoot, originalBranch);
    return false;
  }

  const branchName = branchResult.branch;

  try {
    // Only commit files within the app directory
    const hash = commitPath(repoRoot, appRelativePath, `wizard-test: ${app.name}`);
    console.log(`      Branch: ${branchName}`);
    console.log(`      Commit: ${hash}\n`);
  } catch (e) {
    console.error(`      Failed to commit: ${e}`);
    checkout(repoRoot, originalBranch);
    return false;
  }

  // 5. Push and create PR
  console.log("[5/5] Pushing and creating PR...");
  const remoteUrl = getRemoteUrl(repoRoot, opts.remote);
  console.log(`      Remote: ${opts.remote} (${remoteUrl})`);

  const prResult = pushAndCreatePR({
    repoRoot,
    branch: branchName,
    remote: opts.remote,
    base: opts.base,
    title: `[Wizard Test] ${app.name}`,
    body: `Automated wizard test on \`${app.name}\`\n\nDuration: ${formatMs(result.duration)}`,
    deleteBranchAfter: opts.deleteBranch,
    returnToBranch: originalBranch,
  });

  if (!prResult.success) {
    console.error(`      ${prResult.error}`);
    checkout(repoRoot, originalBranch);
    return false;
  }

  console.log(`      PR: ${prResult.prUrl}\n`);

  // Run evaluation if requested
  if (opts.evaluate && prResult.prUrl) {
    const prNumber = extractPRNumber(prResult.prUrl);
    if (prNumber) {
      console.log("[6/6] Running PR evaluation...");
      console.log(`      PR #${prNumber}\n`);
      const evalResult = await runEvaluator(prNumber);
      if (!evalResult.success) {
        console.warn(`      Evaluation failed: ${evalResult.error}\n`);
      } else {
        console.log(`      Evaluation complete\n`);
      }
    } else {
      console.warn(`      Could not extract PR number from URL: ${prResult.prUrl}\n`);
    }
  }

  if (opts.deleteBranch) {
    console.log(`      Deleted local branch: ${branchName}\n`);
  } else {
    // Return to original branch
    checkout(repoRoot, originalBranch);
  }

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

  // Handle --push-only command
  if (opts.pushOnly) {
    await pushOnlyMode(opts);
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
