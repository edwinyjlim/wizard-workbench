## Required Output Format

Return a JSON object with this EXACT structure:

```json
{
  "summary": {
    "overview": "Brief description of what the PR does",
    "filesChanged": 5,
    "linesAdded": 100,
    "linesRemoved": 20
  },
  "posthogIntegration": {
    "score": 7,
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
    "strengths": ["Good event naming", "Error tracking configured"]
  },
  "runnability": {
    "score": 8,
    "canBuild": true,
    "canRun": true,
    "issues": ["Missing env documentation"],
    "missingDependencies": []
  },
  "codeQuality": {
    "score": 8,
    "isMinimal": true,
    "isUnderstandable": true,
    "isMaintainable": true,
    "disruptionLevel": "low",
    "issues": []
  },
  "overallScore": 7,
  "recommendation": "approve",
  "reviewComment": "The markdown comment to post on the PR"
}
```

Rules:
- Use these exact camelCase property names
- scores are 0-10
- severity is "low", "medium", or "high"
- disruptionLevel is "none", "low", "medium", or "high"
- recommendation is "approve", "request_changes", or "needs_discussion"
- All arrays can be empty [] if no items
- reviewComment should be a formatted markdown summary

Wrap your response in ```json code blocks.
