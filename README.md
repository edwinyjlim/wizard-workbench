# wizard-workbench

The wizard workbench is a few things: 

1. A collection of PostHog-less apps and codebases for testing and experimenting with the [PostHog Wizard](https://github.com/PostHog/wizard).
2. A workshop and target practice environment where you can run the full local development flow end-to-end.
3. A toolbox of scripts and utilities to help you analyze, debug, and inspect Wizard runs. 

## Operator

![Matrix operator](https://res.cloudinary.com/dmukukwp6/image/upload/q_auto,f_auto/operator_7ef04c389d.jpeg)

## Setup

Install [mprocs](https://github.com/pvolok/mprocs):

```bash
brew install mprocs
```

Install dependencies: 

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your paths and API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...   # Required for wizard evaluator

# Adjust if your repos are in different locations
EXAMPLES_PATH=~/development/examples
MCP_PATH=~/development/posthog/products/mcp
WIZARD_PATH=~/development/wizard
```

## Running

```bash
mprocs
```

This starts 4 auto-running processes:

| Process | Description |
|---------|-------------|
| **examples** | Examples server at `localhost:8765` |
| **mcp** | MCP server using local examples |
| **mcp-inspector** | MCP Inspector UI at `localhost:6274` |
| **wizard** | Builds and watches wizard for changes |

Plus manual processes (press `s` to start):

| Process | Description |
|---------|-------------|
| **wizard-run** | Interactive menu to run wizard on a test app |
| **workbench-evaluate** | Evaluate a PR's PostHog integration |

## Test apps

Test applications live in `/apps/<framework>/<app-name>`. 

```
apps/
└── next-js/
    ├── 15-app-router-saas
    ├── 15-app-router-todo
    ├── 15-pages-router-saas
    └── 15-pages-router-todo
```

To add a new test app, create a directory with a `package.json` under `/apps`.
