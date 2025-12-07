# Local Development Workflow Plan

## Overview

This document outlines the **mprocs-driven workflow** for running the PostHog Wizard integration testing pipeline locally. The workflow orchestrates four related repositories with **hot-reloading dev servers** for rapid iteration on the entire wizard integration stack.

**Implementation is divided into phases** - each phase builds on the previous and adds more automation.

---

## Related Repositories

| Repo | Path | Purpose |
|------|------|---------|
| **wizard-workbench** (this repo) | `~/development/wizard-workbench` | Test apps, evaluation service, orchestration hub |
| **examples** | `~/development/examples` | Context generation (integration docs/code) |
| **mcp** | `~/development/posthog/products/mcp` | MCP server serving resources to wizard |
| **wizard** | `~/development/wizard` | Interactive CLI for auto-integrating PostHog |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HOT-RELOAD DEVELOPMENT STACK                            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │    EXAMPLES     │      │      MCP        │      │     WIZARD      │
  │   npm run dev   │─────▶│ pnpm run        │◀─────│  pnpm run dev   │
  │  (hot reload)   │      │ dev:local-res   │      │  (hot rebuild)  │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                        │
         │   zip file updates     │   resources served     │   code rebuilds
         │   automatically        │   from local examples  │   on save
         ▼                        ▼                        ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    wizard --local-mcp                                    │
  │                    (run from any test app)                               │
  └─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         WORKBENCH                                        │
  │         test apps │ git ops │ PR creation │ evaluation                  │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

# Implementation Phases

## Phase 1: Basic mprocs Setup
**Goal:** Get the three dev servers running together with mprocs

### What we build
- [x] `mprocs.yaml` with dev server processes
- [x] `.env.mprocs.example` for configurable paths
- [ ] Basic `reset-apps` utility

### Deliverables
```
wizard-workbench/
├── mprocs.yaml
├── .env.mprocs.example
└── .env.mprocs (user creates from example)
```

### mprocs.yaml (Phase 1)
```yaml
procs:
  # ═══════════════════════════════════════════════════════════════════════════
  # DEV SERVERS - Auto-start for hot-reload development
  # ═══════════════════════════════════════════════════════════════════════════

  examples:
    shell: "cd ${EXAMPLES_PATH:-../examples} && npm run dev"
    autostart: true
    stop_signal: SIGTERM
    env_file: .env.mprocs

  mcp:
    # Use dev:local-resources when available in MCP repo, otherwise dev
    shell: "cd ${MCP_PATH:-../posthog/products/mcp} && pnpm run dev"
    autostart: true
    stop_signal: SIGTERM
    env_file: .env.mprocs

  wizard-dev:
    shell: "cd ${WIZARD_PATH:-../wizard} && pnpm run dev"
    autostart: true
    stop_signal: SIGTERM
    env_file: .env.mprocs

  # ═══════════════════════════════════════════════════════════════════════════
  # UTILITIES
  # ═══════════════════════════════════════════════════════════════════════════

  reset-apps:
    shell: "git checkout -- apps/"
    autostart: false
```

### Usage (Phase 1)
```bash
# Setup
cp .env.mprocs.example .env.mprocs
# Edit paths if repos aren't siblings

# Run
mprocs

# In another terminal, run wizard manually
cd apps/next-js/15-app-router-saas
wizard --local-mcp
```

### Success Criteria
- [ ] `mprocs` starts all three dev servers
- [ ] Hot reload works for each repo
- [ ] Can run `wizard --local-mcp` from test app

---

## Phase 2: Wizard Run Targets
**Goal:** Add wizard run commands to mprocs for different test apps

### What we build
- [ ] Multiple wizard-run targets in mprocs
- [ ] `TEST_APP` env var for default target
- [ ] `test-app-dev` to run the test app's dev server

### mprocs.yaml additions (Phase 2)
```yaml
  # ═══════════════════════════════════════════════════════════════════════════
  # WIZARD RUNS - Trigger on demand (press 's' to start)
  # ═══════════════════════════════════════════════════════════════════════════

  wizard-run:
    shell: "cd ${TEST_APP:-apps/next-js/15-app-router-saas} && wizard --local-mcp"
    autostart: false
    env_file: .env.mprocs

  wizard-run-pages:
    shell: "cd apps/next-js/15-pages-router-saas && wizard --local-mcp"
    autostart: false

  wizard-run-todo:
    shell: "cd apps/next-js/15-app-router-todo && wizard --local-mcp"
    autostart: false

  # ═══════════════════════════════════════════════════════════════════════════
  # UTILITIES (expanded)
  # ═══════════════════════════════════════════════════════════════════════════

  test-app-dev:
    shell: "cd ${TEST_APP:-apps/next-js/15-app-router-saas} && pnpm dev"
    autostart: false
    env_file: .env.mprocs
```

### Usage (Phase 2)
```bash
mprocs

# In mprocs UI:
# - Navigate to wizard-run with j/k
# - Press 's' to start
# - Watch output in the pane
# - Press 'x' to stop when done
```

### Success Criteria
- [ ] Can trigger wizard runs from mprocs UI
- [ ] Can switch between different test app targets
- [ ] Can run test app dev server alongside

---

## Phase 3: Git Operations
**Goal:** Automate branch creation, commit, and PR workflow

### What we build
- [ ] `scripts/create-pr.sh` - creates branch, commits, pushes, opens PR
- [ ] `scripts/reset-all.sh` - deep reset including node_modules/.next
- [ ] `git-pr` process in mprocs

### scripts/create-pr.sh
```bash
#!/bin/bash
set -e

# Configuration
BRANCH_PREFIX="wizard-test"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="${BRANCH_PREFIX}-${TIMESTAMP}"

# Check for changes
if git diff --quiet apps/; then
  echo "No changes in apps/ to commit"
  exit 1
fi

# Create branch
git checkout -b "$BRANCH_NAME"

# Commit changes
git add apps/
git commit -m "test: wizard integration run - $TIMESTAMP"

# Push
git push -u origin "$BRANCH_NAME"

# Create PR and capture URL
PR_URL=$(gh pr create \
  --title "Wizard Test Run: $TIMESTAMP" \
  --body "Automated wizard integration test run" \
  --base main)

echo ""
echo "═══════════════════════════════════════════"
echo "PR created: $PR_URL"
echo "PR number: $(echo $PR_URL | grep -oE '[0-9]+$')"
echo "═══════════════════════════════════════════"
```

### mprocs.yaml additions (Phase 3)
```yaml
  # ═══════════════════════════════════════════════════════════════════════════
  # GIT OPERATIONS
  # ═══════════════════════════════════════════════════════════════════════════

  git-pr:
    shell: "./scripts/create-pr.sh"
    autostart: false

  reset-all:
    shell: "./scripts/reset-all.sh"
    autostart: false
```

### Usage (Phase 3)
```bash
# After wizard run completes with good results:
# Navigate to git-pr in mprocs, press 's'
# Note the PR number from output
```

### Success Criteria
- [ ] Single command creates branch + commit + PR
- [ ] PR URL and number displayed for next step
- [ ] Reset script cleans up thoroughly

---

## Phase 4: PR Evaluation Integration
**Goal:** Connect evaluation to the mprocs workflow

### What we build
- [ ] `evaluate` process with PR_NUMBER from env
- [ ] Instructions for setting PR_NUMBER
- [ ] Output path visible in mprocs

### mprocs.yaml additions (Phase 4)
```yaml
  # ═══════════════════════════════════════════════════════════════════════════
  # EVALUATION
  # ═══════════════════════════════════════════════════════════════════════════

  evaluate:
    shell: |
      if [ -z "$PR_NUMBER" ]; then
        echo "ERROR: Set PR_NUMBER in .env.mprocs first"
        exit 1
      fi
      pnpm run evaluate --pr $PR_NUMBER --test-run
    autostart: false
    env_file: .env.mprocs

  evaluate-post:
    shell: |
      if [ -z "$PR_NUMBER" ]; then
        echo "ERROR: Set PR_NUMBER in .env.mprocs first"
        exit 1
      fi
      pnpm run evaluate --pr $PR_NUMBER
    autostart: false
    env_file: .env.mprocs
```

### Usage (Phase 4)
```bash
# After git-pr creates PR:
# 1. Edit .env.mprocs, set PR_NUMBER=123
# 2. Navigate to evaluate in mprocs, press 's'
# 3. Review output in test-evaluations/
```

### Success Criteria
- [ ] Evaluation runs from mprocs
- [ ] Clear error if PR_NUMBER not set
- [ ] Results saved to test-evaluations/

---

## Phase 5: Full Automation (Future)
**Goal:** End-to-end automation with minimal manual steps

### What we build
- [ ] `scripts/full-run.sh` - orchestrates entire workflow
- [ ] Auto-extraction of PR number from git-pr output
- [ ] Batch mode for multiple test apps
- [ ] Summary report generation

### scripts/full-run.sh (concept)
```bash
#!/bin/bash
# Full automated workflow:
# 1. Reset test app
# 2. Run wizard
# 3. Create PR
# 4. Run evaluation
# 5. Output summary

TEST_APP=${1:-apps/next-js/15-app-router-saas}

echo "Running full workflow on $TEST_APP..."

# Reset
git checkout -- "$TEST_APP"

# Run wizard (needs expect or similar for automation)
cd "$TEST_APP"
wizard --local-mcp --non-interactive  # requires wizard non-interactive mode

# Create PR
cd -
PR_URL=$(./scripts/create-pr.sh | grep "PR created" | awk '{print $3}')
PR_NUMBER=$(echo $PR_URL | grep -oE '[0-9]+$')

# Evaluate
pnpm run evaluate --pr $PR_NUMBER --test-run

echo "Complete! Results in test-evaluations/"
```

### Future enhancements
- [ ] Docker Compose for CI
- [ ] Metrics dashboard
- [ ] Diff viewer between runs
- [ ] Slack/webhook notifications

---

# Reference

## Dev Commands by Repo

### Examples Repo
```bash
cd ~/development/examples
npm run dev          # Hot reload mode
npm run build:docs   # One-time build
```

### MCP Repo
```bash
cd ~/development/posthog/products/mcp
pnpm run dev:local-resources  # Local dev with examples
pnpm run dev                  # Standard dev
pnpm run inspector            # MCP Inspector UI
```

### Wizard Repo
```bash
cd ~/development/wizard
pnpm run dev         # Hot rebuild mode
pnpm build           # One-time build
wizard --local-mcp   # Run with local MCP
```

## Test Apps

| App | Path | Description |
|-----|------|-------------|
| Next.js 15 App Router SaaS | `apps/next-js/15-app-router-saas` | Full SaaS template |
| Next.js 15 App Router Todo | `apps/next-js/15-app-router-todo` | Minimal todo app |
| Next.js 15 Pages Router SaaS | `apps/next-js/15-pages-router-saas` | Pages Router variant |
| Next.js 15 Pages Router Todo | `apps/next-js/15-pages-router-todo` | Pages Router todo |

## mprocs Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j/k` or `↑/↓` | Navigate between processes |
| `s` | Start selected process |
| `x` | Stop selected process |
| `r` | Restart selected process |
| `a` | Toggle auto-scroll |
| `q` | Quit mprocs |

## Environment Setup

### Prerequisites
- [ ] Node.js 18+
- [ ] pnpm (`npm install -g pnpm`)
- [ ] mprocs (`brew install mprocs`)
- [ ] gh CLI (`brew install gh && gh auth login`)

### Repository Setup
```bash
cd ~/development
git clone https://github.com/PostHog/examples.git
git clone https://github.com/PostHog/mcp.git
git clone https://github.com/PostHog/wizard.git
git clone https://github.com/PostHog/wizard-workbench.git

(cd examples && npm install)
(cd posthog/products/mcp && pnpm install)
(cd wizard && pnpm install)
(cd wizard-workbench && pnpm install)
```

### Environment Variables

**wizard-workbench/.env** (API keys):
```bash
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
```

**wizard-workbench/.env.mprocs** (repo paths):
```bash
EXAMPLES_PATH=../examples
MCP_PATH=../posthog/products/mcp
WIZARD_PATH=../wizard
TEST_APP=apps/next-js/15-app-router-saas
PR_NUMBER=
```

## Troubleshooting

### Dev server not hot-reloading
- Check repo's dev server logs in mprocs
- Restart process with `r`
- Check file watcher limits: `ulimit -n`

### MCP not serving updated resources
- Ensure `dev:local-resources` is running (not `dev`)
- Check examples dev server is running
- MCP caching disabled in local-resources mode

### Wizard can't connect to local MCP
- Verify MCP server is running
- Use `wizard --local-mcp` flag
- Check MCP logs for connection attempts

### Test app in broken state
- Run `reset-apps` in mprocs
- Or: `git checkout -- apps/`

### Evaluation fails
- Check `ANTHROPIC_API_KEY` is valid
- Ensure PR exists and is accessible
- Review `test-evaluations/*/prompt.md`
