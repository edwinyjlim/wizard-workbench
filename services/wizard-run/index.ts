#!/usr/bin/env node
/**
 * Wizard Run - Interactive app selector for running the PostHog wizard
 *
 * This script scans the /apps directory for test applications and presents
 * an interactive menu to select which app to run the wizard on.
 *
 * Usage: npx tsx services/wizard-run/index.ts
 *
 * To add new test apps:
 *   1. Create a new directory under /apps/<framework>/<app-name>
 *   2. Ensure it has a package.json
 *   3. The app will automatically appear in the selection menu
 */
import "dotenv/config";
import { createInterface } from "readline";
import { join } from "path";
import { findApps, runWizard, type App } from "../wizard-test/utils.js";

const WORKBENCH = join(import.meta.dirname, "../..");
const APPS_DIR = join(WORKBENCH, "apps");

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectApp(apps: App[]): Promise<App> {
  console.log("Select an app to run the wizard on:\n");
  apps.forEach((app, i) => console.log(`  ${i + 1}) ${app.name}`));
  console.log();

  const selection = await prompt(`Enter number (1-${apps.length}): `);
  const index = parseInt(selection, 10) - 1;

  if (index < 0 || index >= apps.length) {
    console.error("Invalid selection");
    process.exit(1);
  }

  return apps[index];
}

async function main(): Promise<void> {
  const apps = findApps(APPS_DIR);

  if (apps.length === 0) {
    console.error(`No apps found in ${APPS_DIR}`);
    process.exit(1);
  }

  const selectedApp = await selectApp(apps);

  console.log();
  console.log(`Running wizard on: ${selectedApp.name}`);
  console.log(`Path: ${selectedApp.path}`);
  console.log();

  const result = await runWizard(selectedApp.path);

  if (!result.success) {
    console.error(`Wizard failed: ${result.error}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
