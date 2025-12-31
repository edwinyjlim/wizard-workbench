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
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = { all: false, local: false, base: "main", remote: "origin" };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--app" || arg === "-a") opts.app = args[++i];
    else if (arg === "--all") opts.all = true;
    else if (arg === "--local" || arg === "-l") opts.local = true;
    else if (arg === "--base") opts.base = args[++i];
    else if (arg === "--remote" || arg === "-r") opts.remote = args[++i];
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
  const branchName = `wizard-test/${app.name.replace(/\//g, "-")}/${timestamp()}`;

  try {
    createBranch(repoRoot, branchName);
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
