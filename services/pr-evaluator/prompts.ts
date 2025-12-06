import type { PRData } from "./github.js";

export const SYSTEM_PROMPT = `You are a PR evaluation bot that outputs ONLY valid JSON.

Your task: Evaluate PRs for PostHog integration quality and output a structured JSON evaluation.

CRITICAL: Your response must be ONLY a JSON object wrapped in \`\`\`json code blocks. No other text before or after.`;

export function buildEvaluationPrompt(prData: PRData): string {
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
\`\`\`

---

## Evaluation Criteria

### 1. PostHog Integration (Score 0-10)
Check for:
- \`posthog-js\` or \`posthog-node\` in dependencies
- PostHog initialization with API key
- Correct API host configuration
- \`posthog.capture()\` calls for user actions
- Page view tracking setup
- User identification (\`posthog.identify()\`)
- Error tracking setup (exception capture)
- No PII in event properties
- Proper cleanup on unmount (React)

### 2. Runnability (Score 0-10)
Check for:
- All required dependencies installed
- No syntax errors
- Correct import/export statements
- Environment variables documented
- Build configuration is valid

### 3. Code Quality (Score 0-10)
Check for:
- Minimal, focused changes (no unnecessary modifications)
- Clear, readable code
- Consistent with existing patterns
- No technical debt introduced
- Appropriate error handling

---

## Instructions

Analyze the diff above and return ONLY a JSON evaluation. Do not use any tools - the diff contains everything you need.`;
}

export function formatReviewComment(evaluation: {
  summary: { overview: string; filesChanged: number; linesAdded: number; linesRemoved: number };
  posthogIntegration: {
    score: number;
    eventsTracked: string[];
    errorTrackingSetup: boolean;
    issues: { severity: string; description: string; file?: string; suggestion: string }[];
    strengths: string[];
  };
  runnability: {
    score: number;
    canBuild: boolean;
    canRun: boolean;
    issues: string[];
    missingDependencies: string[];
  };
  codeQuality: {
    score: number;
    isMinimal: boolean;
    isUnderstandable: boolean;
    isMaintainable: boolean;
    disruptionLevel: string;
    issues: { type: string; description: string; file?: string }[];
  };
  overallScore: number;
  recommendation: string;
}): string {
  const recEmoji =
    evaluation.recommendation === "approve"
      ? ":white_check_mark:"
      : evaluation.recommendation === "request_changes"
        ? ":x:"
        : ":thinking:";

  let comment = `## PR Evaluation Report

### Summary
${evaluation.summary.overview}

| Files Changed | Lines Added | Lines Removed |
|--------------|-------------|---------------|
| ${evaluation.summary.filesChanged} | +${evaluation.summary.linesAdded} | -${evaluation.summary.linesRemoved} |

---

### PostHog Integration: ${evaluation.posthogIntegration.score}/10
**Events Tracked:** ${evaluation.posthogIntegration.eventsTracked.length > 0 ? evaluation.posthogIntegration.eventsTracked.join(", ") : "None detected"}
**Error Tracking:** ${evaluation.posthogIntegration.errorTrackingSetup ? ":white_check_mark: Configured" : ":x: Not configured"}
`;

  if (evaluation.posthogIntegration.issues.length > 0) {
    comment += `\n#### Issues\n`;
    for (const issue of evaluation.posthogIntegration.issues) {
      const icon = issue.severity === "high" ? ":red_circle:" : issue.severity === "medium" ? ":yellow_circle:" : ":white_circle:";
      comment += `${icon} **${issue.severity.toUpperCase()}**: ${issue.description}`;
      if (issue.file) comment += ` (in \`${issue.file}\`)`;
      comment += `\n   > ${issue.suggestion}\n\n`;
    }
  }

  if (evaluation.posthogIntegration.strengths.length > 0) {
    comment += `\n#### Strengths\n`;
    for (const strength of evaluation.posthogIntegration.strengths) {
      comment += `- :star: ${strength}\n`;
    }
  }

  comment += `
---

### Runnability: ${evaluation.runnability.score}/10
- **Can Build:** ${evaluation.runnability.canBuild ? ":white_check_mark:" : ":x:"}
- **Can Run:** ${evaluation.runnability.canRun ? ":white_check_mark:" : ":x:"}
`;

  if (evaluation.runnability.issues.length > 0) {
    comment += `\n#### Issues\n`;
    for (const issue of evaluation.runnability.issues) {
      comment += `- :warning: ${issue}\n`;
    }
  }

  if (evaluation.runnability.missingDependencies.length > 0) {
    comment += `\n#### Missing Dependencies\n`;
    for (const dep of evaluation.runnability.missingDependencies) {
      comment += `- \`${dep}\`\n`;
    }
  }

  comment += `
---

### Code Quality: ${evaluation.codeQuality.score}/10
| Aspect | Status |
|--------|--------|
| Minimal Changes | ${evaluation.codeQuality.isMinimal ? ":white_check_mark:" : ":x:"} |
| Understandable | ${evaluation.codeQuality.isUnderstandable ? ":white_check_mark:" : ":x:"} |
| Maintainable | ${evaluation.codeQuality.isMaintainable ? ":white_check_mark:" : ":x:"} |
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

### Overall Score: ${evaluation.overallScore}/10
**Recommendation:** ${recEmoji} **${evaluation.recommendation.replace("_", " ").toUpperCase()}**

---
*Generated by PR Evaluation Agent*`;

  return comment;
}
