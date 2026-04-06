# Tasks: Factory Daemon Core

## Phase 1: Infrastructure (Foundation)

- [ ] 1.1 Run `bun create mastra@latest` at repo root; confirm `package.json`, `tsconfig.json`, `src/mastra/index.ts` are generated. **[S]** — satisfies `daemon-bootstrap / Successful scaffold`
- [ ] 1.2 Add missing deps: `@openrouter/ai-sdk-provider`, `@ai-sdk/anthropic`, `@ai-sdk/openai`. Add dev deps: `vitest`, `eslint`, `prettier`. Run `bun install`. **[S]** — dep: 1.1
- [ ] 1.3 Create `tsconfig.json` with strict mode, `@/*` → `src/*` alias, `ES2022` target, `bundler` moduleResolution. **[S]** — dep: 1.1; satisfies `TypeScript passes with no errors`
- [ ] 1.4 Create `vitest.config.ts` with path aliases and `src/` includes. Run `bun test` — confirm 0 tests, exit 0. **[S]** — dep: 1.2; satisfies `Vitest runs on empty suite`
- [ ] 1.5 Create `.eslintrc.cjs` (flat config, TS support) and `.prettierrc` (2 spaces, single quotes, trailing commas). Run `bun lint` — confirm exit 0. **[S]** — dep: 1.2; satisfies `Linting passes on fresh scaffold`
- [ ] 1.6 Create `.env.example` with all required vars: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `DEFAULT_TIER`, `NODE_ENV`, `PORT`, `BASH_ALLOWLIST`. Each entry must have an inline comment. **[S]** — satisfies `daemon-runtime / .env.example is complete`

## Phase 2: Provider Registry

- [ ] 2.1 Create `src/mastra/providers/registry.ts`: define `Tier` type (`free | mid | boost | premium`), export `getModel(tier: Tier): LanguageModelV1`. Route `free`/`mid` to OpenRouter when `OPENROUTER_API_KEY` is set; fallback to Ollama for `free`. **[M]** — dep: 1.3; satisfies `provider-registry / Valid tier resolves a model`, `OpenRouter replaces direct provider`, `No API keys configured`
- [ ] 2.2 Add `ProviderNotConfiguredError` class to `registry.ts`; throw it with missing env var name when a required key is absent. **[S]** — dep: 2.1; satisfies `Requested tier has no configured provider`
- [ ] 2.3 Add model chain fallback per agent: replace rigid `getModel(tier)` with `getModelChain(agentName)` that reads `<AGENT>_MODELS` env var as comma-separated list and returns the first available model. Keep `getModel` as alias for backwards compat. **[M]** — dep: 2.1; satisfies `Per-Agent Tier Configuration` scenarios

## Phase 3: Base Tools

- [ ] 3.1 Create `src/mastra/tools/base/file-read.ts`: `createTool()` with `{ path: z.string() }` input, `{ content: z.string(), exists: z.boolean() }` output. Return `{ error }` (no throw) on missing file. **[S]** — dep: 1.3; satisfies `fileRead returns file contents`, `fileRead on missing file`
- [ ] 3.2 Create `src/mastra/tools/base/file-write.ts`: `createTool()` with `{ path, content }` input; returns `{ success: true }` on write. **[S]** — dep: 1.3; satisfies `fileWrite creates or overwrites a file`
- [ ] 3.3 Create `src/mastra/tools/base/file-edit.ts`: `createTool()` with `{ path, oldStr, newStr }` input; find/replace in file content. **[S]** — dep: 3.1, 3.2
- [ ] 3.4 Create `src/mastra/tools/base/bash-exec.ts`: `createTool()` with `{ command: z.string() }` input. Dev: unrestricted. Prod: hardcoded allowlist (`git bun curl cp mv mkdir cat ls echo`) + optional `BASH_ALLOWLIST` env var extension. Returns `{ error }` on blocked commands. **[M]** — dep: 1.3; satisfies `bashExec runs an allowed command`, `bashExec blocked in production`
- [ ] 3.5 Create `src/mastra/tools/base/git-ops.ts`: `createTool()` with `{ operation: z.enum(['status','diff','commit']), args: z.string().optional() }`. **[S]** — dep: 3.4
- [ ] 3.6 Create `src/mastra/tools/base/index.ts` barrel exporting all five tools. **[S]** — dep: 3.1–3.5; satisfies `Zod input validation rejects bad input` (Mastra validates at call time)

## Phase 4: Agents & Mastra Instance

- [ ] 4.1 Create `src/mastra/agents/echo.ts`: stub agent, tier `free`, instructions to echo input verbatim. No tools needed. **[S]** — dep: 2.1
- [ ] 4.2 Create `src/mastra/agents/orchestrator.ts`: supervisor agent, tier `boost` (via `getModelChain`), `agents: { echo: echoAgent }`, delegation instructions. **[M]** — dep: 2.3, 4.1; satisfies `Successful delegation to echo-agent`, `Unknown delegation target`
- [ ] 4.3 Update `src/mastra/index.ts`: wire `new Mastra({ agents: { orchestrator }, server: { port: Number(process.env.PORT) || 4111 } })`. Register custom `/health` route returning `{ status: "ok", uptime: process.uptime() }`. **[M]** — dep: 4.2; satisfies `Health check returns healthy status`, `Dev server starts`
- [ ] 4.4 Create `src/index.ts` demo entry: `orchestrator.generate("echo: hello world")`, log result. **[S]** — dep: 4.3; manual smoke test

## Phase 5: Container & Runtime

- [ ] 5.1 Create `Dockerfile` — multi-stage: `oven/bun` stage for `bun install` + `mastra build`; `node:22-alpine` run stage copies `.mastra/output`. CMD starts the built server. **[M]** — dep: 4.3; satisfies `Docker image builds`, `Container starts and serves health endpoint`
- [ ] 5.2 Create `docker-compose.yml`: `swarm` service, port `4111:4111`, `env_file: .env`, healthcheck on `/health`, `restart: unless-stopped`. **[S]** — dep: 5.1
- [ ] 5.3 Add startup env-var validation in `src/mastra/index.ts`: if a required var is absent, log all missing vars and `process.exit(1)`. **[S]** — dep: 4.3; satisfies `Missing env vars at container start`, `Runtime starts with only .env.example values`

## Phase 6: Testing

- [ ] 6.1 Write `src/mastra/providers/registry.test.ts`: mock env vars, assert `getModelChain("orchestrator")` returns correct provider for each tier; assert `ProviderNotConfiguredError` on missing key. **[M]** — dep: 2.1–2.3; satisfies `provider-registry` scenarios
- [ ] 6.2 Write `src/mastra/tools/base/file-read.test.ts` and `file-write.test.ts`: mock `fs/promises`, assert return shapes and no-throw on missing file. **[M]** — dep: 3.1, 3.2; satisfies `fileRead`/`fileWrite` scenarios
- [ ] 6.3 Write `src/mastra/tools/base/bash-exec.test.ts`: assert blocked command in prod returns `{ error }`, allowed command returns `{ stdout, exitCode }`. **[S]** — dep: 3.4; satisfies `bashExec` scenarios
- [ ] 6.4 Write `src/mastra/agents/orchestrator.test.ts`: structural assertion — agent has `agents` map, valid instructions, model assigned. No real LLM call needed. **[S]** — dep: 4.2; satisfies `orchestrator-agent` config scenarios
- [ ] 6.5 Run `tsc --noEmit`; fix any type errors until exit code is 0. **[S]** — satisfies `TypeScript passes with no errors`
- [ ] 6.6 Run full test suite `bun test`; confirm all tests pass. **[S]** — final gate
