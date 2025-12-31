/**
 * Reusable utilities for wizard testing
 */
import { execSync, spawn } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

// ============================================================================
// Git utilities
// ============================================================================

export function git(cmd: string, cwd: string): string {
  return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", stdio: "pipe" }).trim();
}

export function gitSafe(cmd: string, cwd: string): string | null {
  try {
    return git(cmd, cwd);
  } catch {
    return null;
  }
}

export function hasChanges(cwd: string): boolean {
  const status = gitSafe("status --porcelain", cwd);
  return status !== null && status.length > 0;
}

export function getChangedFiles(cwd: string): string[] {
  const status = gitSafe("status --porcelain", cwd);
  if (!status) return [];
  return status.split("\n").filter((line) => line.length > 0);
}

export function resetApp(appPath: string): void {
  git("restore .", appPath);
}

export function createBranch(cwd: string, name: string): void {
  git(`checkout -b "${name}"`, cwd);
}

export function commitAll(cwd: string, message: string): string {
  git("add -A", cwd);
  git(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
  return git("rev-parse --short HEAD", cwd);
}

export function getRemoteUrl(cwd: string, remote: string = "origin"): string | null {
  return gitSafe(`remote get-url ${remote}`, cwd);
}

export function push(cwd: string, branch: string, remote: string = "origin"): void {
  git(`push -u ${remote} "${branch}"`, cwd);
}

export function checkout(cwd: string, branch: string): void {
  git(`checkout "${branch}"`, cwd);
}

export function getCurrentBranch(cwd: string): string {
  return git("branch --show-current", cwd);
}

export function getRepoRoot(cwd: string): string {
  return git("rev-parse --show-toplevel", cwd);
}

// ============================================================================
// GitHub CLI utilities
// ============================================================================

export function createPR(cwd: string, title: string, body: string, base: string): string {
  const result = execSync(
    `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --base "${base}"`,
    { cwd, encoding: "utf-8", stdio: "pipe" }
  );
  return result.trim();
}

// ============================================================================
// App discovery
// ============================================================================

export interface App {
  name: string;
  path: string;
}

export function findApps(appsDir: string): App[] {
  const apps: App[] = [];

  function scan(dir: string, prefix: string = ""): void {
    if (!existsSync(dir)) return;

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      const fullPath = join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (existsSync(join(fullPath, "package.json"))) {
        apps.push({ name: relativePath, path: fullPath });
      } else {
        scan(fullPath, relativePath);
      }
    }
  }

  scan(appsDir);
  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// Wizard runner
// ============================================================================

export function getWizardBin(): string {
  const wizardPath = process.env.WIZARD_PATH?.replace(/^~/, process.env.HOME || "");
  return join(wizardPath || `${process.env.HOME}/development/wizard`, "dist/bin.js");
}

export interface WizardResult {
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Run wizard on an app - spawns with inherited stdio for full interactivity
 */
export function runWizard(appPath: string): Promise<WizardResult> {
  const wizardBin = getWizardBin();
  const start = Date.now();

  if (!existsSync(wizardBin)) {
    return Promise.resolve({
      success: false,
      duration: 0,
      error: `Wizard not found: ${wizardBin}`,
    });
  }

  return new Promise((resolve) => {
    // Spawn exactly like wizard-run does - full stdio inherit for interactivity
    const child = spawn("node", [wizardBin, "--local-mcp"], {
      cwd: appPath,
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve({
        success: code === 0,
        duration: Date.now() - start,
        error: code !== 0 ? `Exit code: ${code}` : undefined,
      });
    });

    child.on("error", (err) => {
      resolve({
        success: false,
        duration: Date.now() - start,
        error: err.message,
      });
    });
  });
}

// ============================================================================
// Formatting
// ============================================================================

export function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}
