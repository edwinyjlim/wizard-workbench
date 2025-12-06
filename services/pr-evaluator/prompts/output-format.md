## Required Output Format

Return a JSON object with this EXACT structure:

```json
{
  "summary": {
    "overview": "In-depth summary of the PR changes",
    "filesChanged": 5,
    "linesAdded": 100,
    "linesRemoved": 20
  },
  "fileAnalysis": [
    {
      "filename": "src/instrumentation-client.ts",
      "score": 5,
      "overview": "PostHog client initialization with proper Next.js 15 pattern. Configures error tracking, debug mode, and modern SDK defaults."
    },
    {
      "filename": "next.config.ts",
      "score": 5,
      "overview": "Added PostHog reverse proxy rewrites to circumvent ad-blockers. Clean integration with existing config."
    }
  ],
  "posthogIntegration": {
    "score": 4,
    "eventsTracked": ["todo_created", "page_viewed"],
    "errorTrackingSetup": true,
    "issues": [
      {
        "severity": "medium",
        "description": "Missing user identification",
        "file": "src/app.tsx",
        "suggestion": "Add posthog.identify() call"
      }
    ],
    "criteriaMet": ["Reverse proxy setup to circumvent ad-blockers", "Proper initialization pattern for framework"]
  },
  "codeQuality": {
    "score": 4,
    "breaksApp": false,
    "overwritesExistingCode": false,
    "changesAppLogic": false,
    "isMinimal": true,
    "isUnderstandable": true,
    "disruptionLevel": "low",
    "issues": []
  },
  "insightsQuality": {
    "score": 4,
    "meaningfulEvents": true,
    "enrichedProperties": true,
    "answersProductQuestions": true,
    "issues": [],
    "strengths": ["Events tied to user actions", "Properties provide context"]
  },
  "overallScore": 4,
  "recommendation": "approve",
  "reviewComment": "The markdown comment to post on the PR"
}
```

Rules:
- Use these exact camelCase property names
- scores are 1-5
- severity is "low", "medium", or "high"
- disruptionLevel is "none", "low", "medium", or "high"
- recommendation is "approve", "request_changes", or "needs_discussion"
- All arrays can be empty [] if no items
- fileAnalysis must include an entry for each file changed in the PR
- reviewComment should be a formatted markdown summary

Wrap your response in ```json code blocks.
