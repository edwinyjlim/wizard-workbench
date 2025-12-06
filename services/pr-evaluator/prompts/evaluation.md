## Instructions

**IMPORTANT: Before evaluating, you MUST read each changed file using the Read tool.** The files are located in the GitHub repository at the paths shown in the diff (e.g., `apps/next-js/15-app-router-todo/components/todos/todo-form.tsx`). This allows you to understand the full context of changes and assess whether existing code/logic is preserved.

For each file in the PR:
1. Use the Read tool to view the complete file at its path from the diff
2. Compare the full file against the diff to understand what changed
3. Assess the impact and quality of changes

After reading all files, provide your evaluation.

---

## Evaluation Criteria

### 1. PostHog integration (Score 1-5)
Check for:
- `posthog-js` or `posthog-node` in dependencies
- PostHog initialization with API key
- Correct API host configuration
- Correct initialization patterns by framework
- Captures baseline events (pageviews, screen views, custom events)
- `posthog.capture()` calls for user actions
- Page view tracking setup
- User identification (`posthog.identify()`)
- Error tracking setup (exception capture)
- No PII in event properties
- Proper cleanup on unmount (React)
- Reverse proxy that circumvents adblock issues when sending events to PostHog

### 2. Code quality (Score 1-5)
Check for:
- App runs and is functional
- Preserves existing app code, configs, and logic
- Minimal, focused changes (no unnecessary modifications)
- Clear, readable code
- Consistent with existing patterns
- Appropriate error handling
- No syntax errors
- Correct import/export statements
- Environment variables documented
- Build configuration is valid

### 3. Quality of insights enabled (Score 1-5)
Check for:
- Are the captured events meaningful and tied to real user actions or friction points?
- Events enriched with relevant properties
- Do the insights unlocked help answer real product questions?

### 4. File Analysis
For each file changed in the PR, provide:
- **Filename**: The path to the file
- **Score (1-5)**: Quality/impact score for changes in this file
- **Overview**: Brief description of what changed and why it matters
