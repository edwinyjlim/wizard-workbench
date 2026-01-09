#!/usr/bin/env node
/**
 * Wizard Run - Interactive app selector for running the PostHog wizard
 *
 * This script scans the /apps directory for test applications and presents
 * an interactive menu to select which app to run the wizard on.
 *
 * Usage: npx tsx services/wizard-run/index.ts
 *
 * Environment variables:
 *   WIZARD_BIN - Path to the wizard binary (default: ~/development/wizard/dist/bin.js)
 *
 * To add new test apps:
 *   1. Create a new directory under /apps/<framework>/<app-name>
 *   2. Ensure it has a package.json or at least one file
 *   3. The app will automatically appear in the selection menu
 */
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { spawn } from "child_process";
import * as readline from "readline";

// Paths are relative to this script's location in services/wizard-run/
const WORKBENCH_DIR = join(import.meta.dirname, "../..");
const APPS_DIR = join(WORKBENCH_DIR, "apps");
const WIZARD_BIN = process.env.WIZARD_BIN || join(process.env.HOME!, "development/wizard/dist/bin.js");

interface AppInfo {
  name: string;
  path: string;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Recursively finds all valid app directories under the base directory.
 * An app is considered valid if it contains a package.json or any files.
 * Empty directories (like scaffolding folders) are skipped.
 */
function findApps(baseDir: string, currentPath: string = ""): AppInfo[] {
  const apps: AppInfo[] = [];
  const fullPath = currentPath ? join(baseDir, currentPath) : baseDir;

  if (!existsSync(fullPath)) {
    return apps;
  }

  const entries = readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = currentPath ? join(currentPath, entry.name) : entry.name;
    const entryFullPath = join(baseDir, entryPath);

    // Check if this directory is a valid app (has package.json or other files)
    const hasPackageJson = existsSync(join(entryFullPath, "package.json"));
    const files = readdirSync(entryFullPath);
    const hasFiles = files.some((f) => {
      const fPath = join(entryFullPath, f);
      return statSync(fPath).isFile();
    });

    if (hasPackageJson || hasFiles) {
      apps.push({
        name: entryPath,
        path: entryFullPath,
      });
    } else {
      // Recurse into subdirectories
      apps.push(...findApps(baseDir, entryPath));
    }
  }

  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

async function main(): Promise<void> {
  const apps = findApps(APPS_DIR);

  if (apps.length === 0) {
    console.error(`No apps found in ${APPS_DIR}`);
    process.exit(1);
  }

  console.log("Select an app to run the wizard on:\n");

  apps.forEach((app, index) => {
    console.log(`  ${index + 1}) ${app.name}`);
  });

  console.log();
  const selection = await prompt(`Enter number (1-${apps.length}): `);

  const selectionNum = parseInt(selection, 10);
  if (isNaN(selectionNum) || selectionNum < 1 || selectionNum > apps.length) {
    console.error("Invalid selection");
    process.exit(1);
  }

  const selectedApp = apps[selectionNum - 1];

  console.log();
  console.log(`Running wizard on: ${selectedApp.name}`);
  console.log(`Path: ${selectedApp.path}`);
  console.log();

  // Spawn the wizard process with --local-mcp to use the local MCP server
  // and --debug for verbose output. Modify flags here to change wizard behavior.
  const child = spawn("node", [WIZARD_BIN, "--local-mcp"], {
    cwd: selectedApp.path,
    stdio: "inherit",
    env: process.env,
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error(`Failed to start wizard: ${err.message}`);
    process.exit(1);
  });
}

main();
