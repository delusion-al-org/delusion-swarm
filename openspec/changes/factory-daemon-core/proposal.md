# Proposal: Factory Daemon Core

## Intent

delusion-swarm needs a runnable foundation before any domain logic (scouting, forging, deploying) can exist. Today the repo is empty — no package.json, no agents, no tools. This change scaffolds the Mastra project, defines the Orchestrator supervisor agent with sub-agent delegation, implements shared base tools, and wires up the multi-provider LLM tier system. The goal: `pnpm dev` runs, the Orchestrator delegates a dummy task to a stub sub-agent, and the team has a working skeleton to build every future change on top of.

## Scope

### In Scope
- Project scaffolding via `create-mastra` / `mastra init` (package.json, tsconfig, Mastra config)
- Folder structure following Mastra conventions (`src/mastra/agents/`, `src/mastra/tools/`, `src/mastra/workflows/`)
- Orchestrator supervisor agent definition with `agents` property for sub-agent delegation
- Provider registry with tier system: `free` (Ollama / NVIDIA NIM), `mid` (Groq), `boost` (Claude Sonnet), `premium` (Claude Opus / GPT-4o)
- Base tools shared by all agents: `fileRead`, `fileWrite`, `fileEdit`, `bashExec`, `gitOps` (via `createTool()` + Zod schemas)
- Stub sub-agent (`echo-agent`) to validate supervisor delegation end-to-end
- Environment config (`.env.example`) with provider API key placeholders
- Dev tooling: ESLint, Prettier, Vitest config (empty test suite, ready for future changes)
- Minimal runnable demo: Orchestrator receives a prompt, delegates to echo-agent, returns combined result

### Out of Scope
- Scout / crawling / OSM Overpass logic
- Forge / site generation / template cloning
- Deployer / GitHub Pages CI integration
- UI library / DaisyUI / seeds / blocks
- Supabase integration / database schemas
- Admin panel / dashboard
- Maintainer agent logic

## Capabilities

### New Capabilities
- `daemon-bootstrap`: Project scaffolding (bun), Mastra config, folder structure, dev tooling, Dockerfile
- `orchestrator-agent`: Supervisor agent definition with sub-agent delegation pattern, per-agent tier config
- `provider-registry`: Multi-tier LLM provider config (free/mid/boost/premium) with OpenRouter gateway support
- `base-tools`: Shared tool definitions (file I/O, bash, git) used across all agents
- `daemon-runtime`: Dockerfile (oven/bun), docker-compose, health endpoint, env-based config

### Modified Capabilities
None — greenfield project.

## Approach

1. **Scaffold** with `create-mastra` CLI targeting the repo root. Use **bun** as package manager and runtime (official Mastra support, faster installs, built-in TS runner). Adjust generated structure to match our conventions.
2. **Provider registry** as a standalone module (`src/mastra/providers/registry.ts`) exporting model instances per tier. Uses Mastra's Vercel AI SDK integration — each tier maps to a `modelId` + provider config. Runtime selection via `getModel(tier)` helper. Supports OpenRouter as unified gateway for free/mid tiers.
3. **Orchestrator** defined as a supervisor `Agent` with `agents: { echo: echoAgent }`. The supervisor instructions describe the delegation strategy and available sub-agents. Mastra auto-converts sub-agents to tools named `agent-<key>`. Each agent has a configurable default tier.
4. **Base tools** created with `createTool()` — each with Zod input/output schemas. Grouped in `src/mastra/tools/base/`. Attached to agents via the `tools` property.
5. **Demo entry point** in `src/index.ts` — calls `orchestrator.stream()` with a test prompt, prints delegated result. Validates the full chain works.
6. **Containerization**: Dockerfile (`oven/bun` base image) + docker-compose.yml for local dev / Coolify VPS deployment. Health endpoint (`/health`) via Mastra's built-in HTTP server for container orchestration liveness checks.
7. **Config via environment**: All provider keys, tier defaults, and runtime config via env vars. `.env.example` documents every variable. Zero hardcoded values.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Dependencies: `@mastra/core`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/openrouter`, Zod, Vitest, ESLint, Prettier |
| `tsconfig.json` | New | Strict TS config, path aliases |
| `src/mastra/index.ts` | New | Mastra instance config and agent registration |
| `src/mastra/agents/orchestrator.ts` | New | Supervisor agent with delegation instructions, per-agent tier config |
| `src/mastra/agents/echo.ts` | New | Stub sub-agent for validation |
| `src/mastra/tools/base/` | New | fileRead, fileWrite, fileEdit, bashExec, gitOps tools |
| `src/mastra/providers/registry.ts` | New | Tier-based provider config with OpenRouter gateway |
| `src/index.ts` | New | Demo entry point |
| `.env.example` | New | API key placeholders for all providers (OpenRouter, Anthropic, OpenAI, Ollama URL) |
| `Dockerfile` | New | Production container (oven/bun base), multi-stage build |
| `docker-compose.yml` | New | Local dev + Coolify-ready service definition |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mastra breaking changes (framework is young, active development) | Med | Pin exact versions in package.json. Track changelog. |
| Ollama/NIM free tier rate limits or downtime | Low | Provider registry supports fallback — if free fails, warn and suggest boost |
| Base tools (bash, file write) are powerful — security risk if exposed wrong | Med | Tools get Zod input validation. bashExec restricted to allowlisted commands in production. Dev mode is unrestricted. |
| Supervisor delegation overhead adds latency | Low | Acceptable for v1. Monitor token usage. Optimize later if needed. |

## Rollback Plan

This is a greenfield scaffolding change. Rollback = `git revert` the merge commit. No existing code is modified, no data migrations, no external state changes. Clean revert with zero side effects.

## Dependencies

- Bun >= 1.1 (package manager + runtime)
- Docker (for containerized deployment to Coolify/VPS)
- Mastra CLI (`create-mastra` / `mastra init`)
- Ollama installed locally for free-tier dev (optional — can use OpenRouter free models instead)

## Success Criteria

- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm dev` starts the Mastra dev server
- [ ] Orchestrator agent receives a prompt and delegates to echo-agent via supervisor pattern
- [ ] Echo-agent responds and Orchestrator returns the combined result
- [ ] Provider registry resolves correct model for each tier (free/mid/boost/premium)
- [ ] All base tools have Zod schemas and pass type-check (`tsc --noEmit`)
- [ ] ESLint + Prettier configured and passing on all source files
- [ ] Vitest runs (even if test suite is empty — infrastructure is ready)
