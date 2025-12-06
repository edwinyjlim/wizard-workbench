## Evaluation Criteria

### 1. PostHog Integration (Score 0-10)
Check for:
- `posthog-js` or `posthog-node` in dependencies
- PostHog initialization with API key
- Correct API host configuration
- `posthog.capture()` calls for user actions
- Page view tracking setup
- User identification (`posthog.identify()`)
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

Analyze the diff above and return ONLY a JSON evaluation. Do not use any tools - the diff contains everything you need.
