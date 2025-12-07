import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { PRData } from "./github.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load prompt templates from .md files
const SYSTEM_PROMPT = readFileSync(join(__dirname, "prompts/system.md"), "utf-8").trim();
const EVALUATION_CRITERIA = readFileSync(join(__dirname, "prompts/evaluation.md"), "utf-8").trim();
const OUTPUT_FORMAT = readFileSync(join(__dirname, "prompts/output-format.md"), "utf-8").trim();

function buildPRContext(prData: PRData): string {
  return `## PR to evaluate and review

Evaluate this pull request.

### PR Information
- **Title:** ${prData.title}
- **Author:** ${prData.author}
- **Base Branch:** ${prData.baseBranch}
- **Head Branch:** ${prData.headBranch}

### PR Description
${prData.description || "(No description provided)"}

### Changed Files
${prData.files.map((f) => `- ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})`).join("\n")}

### Diff
\`\`\`diff
${prData.diff}
\`\`\``;
}

export function buildFullPrompt(prData: PRData): string {
  return `
  ${SYSTEM_PROMPT}

  ${EVALUATION_CRITERIA}

  ${OUTPUT_FORMAT}

  ${buildPRContext(prData)}

  `;
}
