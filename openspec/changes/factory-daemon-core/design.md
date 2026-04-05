# Design: Factory Daemon Core

## Technical Approach

Scaffold a Mastra project using bun as runtime, with a supervisor Orchestrator agent that delegates to sub-agents via the `agents` property. A provider registry module abstracts LLM tier selection (`free/mid/boost/premium`) behind a `getModel(tier)` helper. Base tools use `createTool()` with Zod schemas. The built-in Mastra server (Hono-based, port 4111) handles HTTP + health. Production runs via `mastra build` output inside an `oven/bun` Docker image.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Package manager | bun | pnpm, npm | Faster installs, native TS runner, official Mastra support. Matches proposal constraint. |
| Server strategy | `mastra build` + built-in Hono server | Custom Express/Hono adapter | Mastra auto-generates server with agent/tool endpoints. Less glue code, auto health endpoint at `/api/health`. |
| Health endpoint | Custom route via `registerApiRoute('/health')` at root | Rely on `/api/health` default | Coolify/Docker expects `/health` at root. Mastra supports custom root routes (2026 fix). |
| Provider abstraction | Single `registry.ts` with `getModel(tier)` function | Per-agent inline model config | Centralizes provider logic. Agents declare tier, registry resolves model. Easy to swap providers without touching agents. |
| OpenRouter as gateway | `@openrouter/ai-sdk-provider` for free/mid tiers | Direct provider SDKs per model | Single API key covers dozens of models. Reduces env var sprawl. Direct SDK only for boost/premium where latency matters. |
| Sub-agent delegation | Supervisor `agents` property (first-class pattern) | Manual tool-based delegation | Mastra auto-converts sub-agents to tools named `agent-<key>`. Memory isolation built-in. No custom wiring. |
| Docker runtime | `oven/bun` base for install + `node:22-alpine` for run | Single bun image | `mastra build` outputs `.mjs` targeting Node. Bun for fast dependency install, Node for stable server runtime. |
| Tool grouping | One file per tool in `src/mastra/tools/base/` + barrel export | Single tools file | Keeps tools independently testable. Barrel in `index.ts` for clean imports. |

## Data Flow

```
User prompt
    |
    v
Orchestrator (supervisor, boost tier)
    |--- reads instructions + available sub-agents
    |--- decides delegation via agent-<key> auto-tools
    |
    v
Sub-agent (e.g. echo-agent, free tier)
    |--- receives delegation prompt + conversation context
    |--- executes with own tools + model
    |--- returns result (only delegation saved to sub-agent memory)
    |
    v
Orchestrator synthesizes response
    |
    v
HTTP Response (stream or generate)
```

Provider resolution flow:
```
Agent config (tier: "boost")
    |
    v
getModel("boost") → registry lookup
    |
    v
Provider instance (e.g. openrouter("anthropic/claude-sonnet-4"))
    |
    v
Vercel AI SDK model object → Agent.model property
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | bun project. Deps: `@mastra/core`, `@openrouter/ai-sdk-provider`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod`. Dev: `vitest`, `eslint`, `prettier`, `typescript`. |
| `tsconfig.json` | Create | Strict mode, `@/*` path alias to `src/*`, ES2022 target, bundler moduleResolution. |
| `src/mastra/index.ts` | Create | `new Mastra({ agents: { orchestrator }, server: { port: 4111 } })`. Registers agents, custom `/health` route. |
| `src/mastra/agents/orchestrator.ts` | Create | Supervisor agent: `agents: { echo: echoAgent }`, tier `boost`, delegation instructions. |
| `src/mastra/agents/echo.ts` | Create | Stub agent: tier `free`, echoes input. Validates delegation chain. |
| `src/mastra/providers/registry.ts` | Create | `getModel(tier)` helper. Maps tiers to provider+modelId. Reads env vars for API keys. |
| `src/mastra/tools/base/file-read.ts` | Create | `createTool()` — reads file content. Zod: `{ path: z.string() }` |
| `src/mastra/tools/base/file-write.ts` | Create | `createTool()` — writes file content. Zod: `{ path, content }` |
| `src/mastra/tools/base/file-edit.ts` | Create | `createTool()` — find/replace in file. Zod: `{ path, oldStr, newStr }` |
| `src/mastra/tools/base/bash-exec.ts` | Create | `createTool()` — runs shell command. Zod: `{ command }`. Allowlist in prod. |
| `src/mastra/tools/base/git-ops.ts` | Create | `createTool()` — git operations (status, diff, commit). Zod: `{ operation, args }` |
| `src/mastra/tools/base/index.ts` | Create | Barrel export for all base tools. |
| `src/index.ts` | Create | Demo entry: calls `orchestrator.generate()` with test prompt, logs result. |
| `.env.example` | Create | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `DEFAULT_TIER`, `NODE_ENV`. |
| `Dockerfile` | Create | Multi-stage: bun install + mastra build, then node:22-alpine run stage. |
| `docker-compose.yml` | Create | Single `swarm` service, port 4111, env_file, healthcheck, restart policy. |
| `.eslintrc.cjs` | Create | Flat config with TS support. |
| `.prettierrc` | Create | Consistent formatting (2 spaces, single quotes, trailing commas). |
| `vitest.config.ts` | Create | Path aliases, `src/` includes. Empty but ready. |

## Interfaces / Contracts

```typescript
// src/mastra/providers/registry.ts
type Tier = 'free' | 'mid' | 'boost' | 'premium';
function getModel(tier: Tier): LanguageModelV1;

// Tool input schemas (representative example)
// file-read.ts
const inputSchema = z.object({ path: z.string().describe('Absolute file path') });
const outputSchema = z.object({ content: z.string(), exists: z.boolean() });

// bash-exec.ts
const inputSchema = z.object({
  command: z.string().describe('Shell command to execute'),
});
const outputSchema = z.object({ stdout: z.string(), stderr: z.string(), exitCode: z.number() });
```

## Folder Structure

```
delusion-swarm/
  package.json
  tsconfig.json
  vitest.config.ts
  .eslintrc.cjs
  .prettierrc
  .env.example
  Dockerfile
  docker-compose.yml
  src/
    index.ts                          # Demo entry point
    mastra/
      index.ts                        # Mastra instance + agent registration
      agents/
        orchestrator.ts               # Supervisor agent
        echo.ts                       # Stub sub-agent
      providers/
        registry.ts                   # Tier-based model resolution
      tools/
        base/
          index.ts                    # Barrel export
          file-read.ts
          file-write.ts
          file-edit.ts
          bash-exec.ts
          git-ops.ts
      workflows/                      # Empty — ready for future changes
  openspec/                           # Existing — unchanged
  .atl/                               # Existing — unchanged
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Provider registry returns correct model per tier | Vitest, mock env vars |
| Unit | Each base tool validates input schema and executes | Vitest, mock fs/child_process |
| Unit | Orchestrator agent config is valid (has agents, tools, instructions) | Vitest, structural assertion |
| Integration | Supervisor delegates to echo-agent and returns result | Vitest, real Mastra agent with mock LLM |
| E2E | `mastra build` succeeds, server starts, `/health` responds 200 | Docker build + curl in CI |

## Migration / Rollout

No migration required. Greenfield scaffolding. Rollback = `git revert` the merge commit.

## Environment Variable Contract

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes (if using free/mid) | — | OpenRouter gateway key |
| `ANTHROPIC_API_KEY` | No | — | Direct Anthropic access for boost tier |
| `OPENAI_API_KEY` | No | — | Direct OpenAI access for premium tier |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Local Ollama for free tier fallback |
| `DEFAULT_TIER` | No | `free` | Default LLM tier when not specified |
| `NODE_ENV` | No | `development` | Controls bash-exec allowlist enforcement |
| `PORT` | No | `4111` | Server port (Mastra default) |

## Open Questions

- [ ] Exact free-tier model rotation strategy via OpenRouter (random pick vs round-robin vs cheapest available?)
- [ ] Should `bash-exec` allowlist be configurable via env var or hardcoded per environment?
