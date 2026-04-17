# ts-planner-agent

**Step-by-step task planning TypeScript AI agent** — decompose complex goals into ordered, dependency-aware plans with effort estimates and optional plan repair.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)

Built with [Vercel AI SDK](https://sdk.vercel.ai/) (`generateObject` + Zod) for reliable structured outputs.

---

## What is this?

`ts-planner-agent` turns **ambiguous high-level goals** into **executable step-by-step plans**. It plans first: it understands the goal, breaks it into sub-goals and concrete actions, orders them with dependencies, estimates effort, and can **adapt** the plan when a step fails.

**Good fits:** project automation, research workflows, learning paths, DevOps runbooks, or any task that benefits from an auditable DAG of steps.

---

## Features

| Feature | Description |
|--------|-------------|
| Goal decomposition | Breaks goals into concrete steps (configurable max, default 20). |
| Dependency handling | `dependsOn` forms a DAG; cycles are detected and broken safely. |
| Effort estimation | Per-step `estimatedMinutes`, `complexity` (1–5), and `risk`. |
| Plan adaptation | `adapt()` re-plans after a failed step with context. |
| Verification strings | Optional per-step success checks (`includeVerification`). |
| Strategies | `top-down`, `bottom-up`, or `mixed` (prompt shaping). |
| Exports | Markdown, Mermaid flowchart, Gantt-style offsets (`ganttFromPlan`). |
| Local models | Works with OpenAI-compatible endpoints (e.g. Ollama) via `OLLAMA_BASE_URL`. |

---

## Requirements

- **Node.js 20+**
- One of: **OpenAI API key**, **Anthropic** (for `anthropic/...` models), **Groq** (`GROQ_*`), or **Ollama** (`OLLAMA_BASE_URL`, no cloud key required for local models).

---

## Installation

```bash
cd ts-planner-agent
npm install
```

Copy `.env.example` to `.env` and set credentials.

---

## Quick start

### 1. Environment

```env
OPENAI_API_KEY=sk-...
# Optional defaults:
PLANNER_MODEL=gpt-4o-mini
PORT=3000
```

For **Ollama** (OpenAI-compatible API):

```env
OLLAMA_BASE_URL=http://localhost:11434
PLANNER_MODEL=llama3.2
```

For **Anthropic**:

```env
ANTHROPIC_API_KEY=...
# Use model id: anthropic/claude-3-5-sonnet-20241022
```

For **Groq** (OpenAI-compatible):

```env
GROQ_API_KEY=...
GROQ_BASE_URL=https://api.groq.com/openai/v1
PLANNER_MODEL=llama-3.3-70b-versatile
```

### 2. Programmatic usage

```typescript
import { PlannerAgent } from "./src/index.js";

const planner = new PlannerAgent({
  model: "openai/gpt-4o-mini",
  strategy: "top-down",
});

const goal =
  "Build a personal portfolio website with a contact form and blog.";

const plan = await planner.plan(goal);

console.log(plan.summary);

plan.steps.forEach((step, i) => {
  const deps = step.dependsOn.length ? step.dependsOn.join(", ") : "none";
  console.log(
    `${i + 1}. ${step.description} (${step.estimatedMinutes} min) [depends on: ${deps}]`,
  );
});
```

Run with `npx tsx your-script.ts` from the repo root, or compile and import from `./dist/index.js`. When you depend on this package from another project, use `import { PlannerAgent } from "ts-planner-agent"`.

Constraint-based planning:

```typescript
const plan = await planner.plan("Deploy a machine learning model", {
  constraints: [
    "Must use only free tier services",
    "Must complete within 2 hours",
  ],
});
```

### 3. REST API

Development (TypeScript, reload on change):

```bash
npm run dev
```

Production-style (compile first, then run compiled server):

```bash
npm run build
npm start
```

- `GET /health` — liveness.
- `POST /plan` — JSON body: `{ "goal": "...", "context": { "constraints": [] }, "strategy": "top-down", "maxSteps": 20 }`.
- `POST /adapt` — JSON body: `{ "plan": { ... }, "input": { "failedStepId": "...", "failureReason": "..." } }`. The `plan` object must include **`goal`** (string) and **`steps`** (array). Other fields (`summary`, `assumptions`, `risks`, `id`, `totalEstimatedMinutes`, `createdAt`) are optional and get safe defaults if omitted.

Example:

```bash
curl -sS -X POST http://localhost:3000/plan \
  -H "Content-Type: application/json" \
  -d '{"goal":"Ship a minimal CRUD API with tests"}' | jq .
```

### 4. CLI

```bash
npm run cli -- "Plan a two-week TypeScript learning path"
# or
npm run cli
# then enter a goal when prompted
```

---

## How it works

1. **Goal understanding** — the model infers domain, constraints, and success criteria (via prompts + optional `constraints`).
2. **Decomposition** — strategy-specific instructions (`top-down` / `bottom-up` / `mixed`).
3. **Structured output** — Zod-validated steps with ids, dependencies, estimates, and risks.
4. **DAG normalization** — invalid dependency ids are stripped; cycles are broken and noted in `assumptions`.
5. **Totals** — `totalEstimatedMinutes` sums all steps (including nested `subSteps` when present).

**Request safety:** unknown `strategy` values fall back to `top-down`; invalid or missing `maxSteps` defaults to **20** (clamped 3–50); `includeVerification` accepts booleans or `"true"` / `"false"` strings.

---

## API reference

### Types

```typescript
interface PlanStep {
  id: string;
  description: string;
  dependsOn: string[];
  estimatedMinutes: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  risk: "low" | "medium" | "high";
  verification?: string;
  subSteps?: PlanStep[];
}

interface Plan {
  id: string;
  goal: string;
  summary: string;
  steps: PlanStep[];
  totalEstimatedMinutes: number;
  assumptions: string[];
  risks: string[];
  createdAt: Date;
}
```

### `PlannerAgent`

```typescript
const planner = new PlannerAgent({
  model: "openai/gpt-4o-mini",
  strategy: "top-down" | "bottom-up" | "mixed",
  maxSteps: 30,
  includeVerification: true,
});

const plan = await planner.plan(goal, context?: { constraints: string[] });

const updated = await planner.adapt(plan, {
  failedStepId: "step-5",
  failureReason: "API rate limit exceeded",
  alternativeApproach: "use batch processing",
});

const mermaid = planner.toMermaid(plan);

const comparison = planner.compare(planA, planB);

const interactive = await planner.planInteractive(goal); // CLI-style follow-up if stdin is a TTY
```

### Exports

- `planToMarkdown(plan)`
- `planToMermaid(plan)` — top-level dependency flowchart (`flowchart TD`).
- `ganttFromPlan(plan)` — `{ id, name, startOffsetMinutes, durationMinutes, dependencies }[]`.

---

## Docker

```bash
docker build -t ts-planner-agent .
docker run -p 3000:3000 --env-file .env ts-planner-agent
```

---

## Testing

```bash
npm test
npm run test:planning
npm run test:adaptation
```

Tests mock the LLM (`ai.generateObject`) so **no API keys are required** for CI. The suite is **20 tests** in **8 files**, covering planning, adaptation, dependency graphs, coercion, HTTP plan normalization, listen-port parsing, and exporters.

---

## Project layout

```
ts-planner-agent/
├── src/
│   ├── planner/
│   │   ├── PlannerAgent.ts
│   │   ├── coerce.ts
│   │   ├── decomposer.ts
│   │   ├── dependency.ts
│   │   ├── estimator.ts
│   │   ├── adapter.ts
│   │   ├── model.ts
│   │   ├── schema.ts
│   │   └── exporters/
│   │       ├── mermaid.ts
│   │       ├── markdown.ts
│   │       └── gantt.ts
│   ├── cli/
│   │   └── index.ts
│   ├── api/
│   │   ├── server.ts
│   │   ├── listenPort.ts
│   │   └── normalizePlan.ts
│   └── index.ts
├── tests/
├── .env.example
├── Dockerfile
├── LICENSE
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

Compiled JavaScript and declarations are emitted to **`dist/`** (listed in `.gitignore`). Run `npm run build` to generate them before `npm start` or publishing.

---

## Contributing

1. Fork and create a feature branch.
2. Add tests for new behavior (`npm test`).
3. Open a pull request with a clear description.

---

## License

MIT

---

## Acknowledgements

- [Vercel AI SDK](https://sdk.vercel.ai/) — structured generation with Zod.
- Ideas from hierarchical task planning and goal-oriented workflows in agent systems.
