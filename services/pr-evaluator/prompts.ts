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
  return `## PR Evaluation Task

Evaluate this pull request for PostHog integration quality.

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
  return `${SYSTEM_PROMPT}

${buildPRContext(prData)}

---

${EVALUATION_CRITERIA}

${OUTPUT_FORMAT}`;
}

export function formatReviewComment(evaluation: {
  summary: { overview: string; filesChanged: number; linesAdded: number; linesRemoved: number };
  fileAnalysis: { filename: string; score: number; overview: string }[];
  posthogIntegration: {
    score: number;
    eventsTracked: string[];
    errorTrackingSetup: boolean;
    issues: { severity: string; description: string; file?: string; suggestion: string }[];
    criteriaMet: string[];
  };
  codeQuality: {
    score: number;
    breaksApp: boolean;
    overwritesExistingCode: boolean;
    changesAppLogic: boolean;
    isMinimal: boolean;
    isUnderstandable: boolean;
    disruptionLevel: string;
    issues: { type: string; description: string; file?: string }[];
  };
  insightsQuality: {
    score: number;
    meaningfulEvents: boolean;
    enrichedProperties: boolean;
    answersProductQuestions: boolean;
    issues: string[];
    strengths: string[];
  };
  overallScore: number;
  recommendation: string;
}): string {
  const recEmoji =
    evaluation.recommendation === "approve"
      ? "✅"
      : evaluation.recommendation === "request_changes"
        ? "❌"
        : "🤔";

  let comment = `## PR Evaluation Report

### Summary
${evaluation.summary.overview}

| Files Changed | Lines Added | Lines Removed |
|--------------|-------------|---------------|
| ${evaluation.summary.filesChanged} | +${evaluation.summary.linesAdded} | -${evaluation.summary.linesRemoved} |

---

### Important Files Changed

| Filename | Score | Overview |
|----------|-------|----------|
`;

  for (const file of evaluation.fileAnalysis) {
    comment += `| \`${file.filename}\` | ${file.score}/5 | ${file.overview} |\n`;
  }

  comment += `
---

### PostHog Integration: ${evaluation.posthogIntegration.score}/5
**Events Tracked:** ${evaluation.posthogIntegration.eventsTracked.length > 0 ? evaluation.posthogIntegration.eventsTracked.join(", ") : "None detected"}
**Error Tracking:** ${evaluation.posthogIntegration.errorTrackingSetup ? "✅ Configured" : "❌ Not configured"}
`;

  if (evaluation.posthogIntegration.issues.length > 0) {
    comment += `\n#### Issues\n`;
    for (const issue of evaluation.posthogIntegration.issues) {
      const icon = issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "⚪";
      comment += `- ${icon} **${issue.severity.toUpperCase()}**: ${issue.description}`;
      if (issue.file) comment += ` (in \`${issue.file}\`)`;
      comment += `\n  - ${issue.suggestion}\n`;
    }
  }

  if (evaluation.posthogIntegration.criteriaMet.length > 0) {
    comment += `\n#### Criteria met\n`;
    for (const criteria of evaluation.posthogIntegration.criteriaMet) {
      comment += `- ✅ ${criteria}\n`;
    }
  }

  comment += `
---

### Code Quality: ${evaluation.codeQuality.score}/5
| Aspect | Status |
|--------|--------|
| Breaks App | ${evaluation.codeQuality.breaksApp ? "❌ Yes" : "✅ No"} |
| Overwrites Existing Code | ${evaluation.codeQuality.overwritesExistingCode ? "❌ Yes" : "✅ No"} |
| Changes App Logic | ${evaluation.codeQuality.changesAppLogic ? "⚠️ Yes" : "✅ No"} |
| Minimal Changes | ${evaluation.codeQuality.isMinimal ? "✅" : "❌"} |
| Understandable | ${evaluation.codeQuality.isUnderstandable ? "✅" : "❌"} |
| Disruption Level | ${evaluation.codeQuality.disruptionLevel} |
`;

  if (evaluation.codeQuality.issues.length > 0) {
    comment += `\n#### Issues\n`;
    for (const issue of evaluation.codeQuality.issues) {
      comment += `- **${issue.type}**: ${issue.description}`;
      if (issue.file) comment += ` (in \`${issue.file}\`)`;
      comment += `\n`;
    }
  }

  comment += `
---

### Quality of Insights: ${evaluation.insightsQuality.score}/5
| Aspect | Status |
|--------|--------|
| Meaningful Events | ${evaluation.insightsQuality.meaningfulEvents ? "✅" : "❌"} |
| Enriched Properties | ${evaluation.insightsQuality.enrichedProperties ? "✅" : "❌"} |
| Answers Product Questions | ${evaluation.insightsQuality.answersProductQuestions ? "✅" : "❌"} |
`;

  if (evaluation.insightsQuality.issues.length > 0) {
    comment += `\n#### Issues\n`;
    for (const issue of evaluation.insightsQuality.issues) {
      comment += `- ⚠️ ${issue}\n`;
    }
  }

  if (evaluation.insightsQuality.strengths.length > 0) {
    comment += `\n#### Strengths\n`;
    for (const strength of evaluation.insightsQuality.strengths) {
      comment += `- ✅ ${strength}\n`;
    }
  }

  comment += `
---

### Overall Score: ${evaluation.overallScore}/5
**Recommendation:** ${recEmoji} **${evaluation.recommendation.replace("_", " ").toUpperCase()}**

---
*Generated by PR Evaluation Agent*`;

  return comment;
}
