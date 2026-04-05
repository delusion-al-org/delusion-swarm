# Specification: Factory Daemon Core

## Change: factory-daemon-core
## Status: draft
## Date: 2026-04-04

---

## Capability: daemon-bootstrap

### Requirement: Project Initialization

The system MUST be scaffoldable with a single command using bun as the package manager and runtime. The generated structure MUST follow Mastra conventions.

#### Scenario: Successful scaffold

- GIVEN an empty repo with only a `.git` folder
- WHEN `bun create mastra` or `mastra init` is executed at the repo root
- THEN `package.json`, `tsconfig.json`, and `src/mastra/index.ts` are created
- AND dependencies include `@mastra/core`, `zod`, and the AI SDK provider packages

#### Scenario: Dev server starts

- GIVEN the project has been scaffolded and `.env` contains at least one valid provider key
- WHEN `bun dev` is executed
- THEN the Mastra dev server starts without errors
- AND the process listens on the configured port (default: 4111)

#### Scenario: TypeScript passes with no errors

- GIVEN all source files exist under `src/`
- WHEN `tsc --noEmit` is executed
- THEN the exit code is 0 with no type errors

### Requirement: Dev Tooling

The project MUST include ESLint, Prettier, and Vitest configured and passing on a clean scaffold.

#### Scenario: Linting passes on fresh scaffold

- GIVEN source files have just been created by the scaffold
- WHEN `bun lint` is executed
- THEN exit code is 0 with no lint errors

#### Scenario: Vitest runs on empty suite

- GIVEN no test files have been written yet
- WHEN `bun test` is executed
- THEN Vitest starts, reports 0 tests, and exits with code 0

---

## Capability: orchestrator-agent

### Requirement: Supervisor Agent Definition

The Orchestrator MUST be defined as a Mastra `Agent` with an `agents` property mapping named sub-agents for delegation. It MUST receive a natural-language prompt, identify the appropriate sub-agent, delegate, and return the combined result.

#### Scenario: Successful delegation to echo-agent

- GIVEN the Orchestrator has `echo-agent` registered in its `agents` map
- WHEN the Orchestrator receives the prompt "echo: hello world"
- THEN it delegates to `echo-agent` via the `agent-echo` tool
- AND it returns the echo-agent's response in its final output

#### Scenario: Unknown delegation target

- GIVEN the Orchestrator has no sub-agent registered for the requested task
- WHEN the Orchestrator receives a prompt it cannot route
- THEN it responds with a message explaining no capable sub-agent is available
- AND it does NOT throw an unhandled exception

### Requirement: Per-Agent Tier Configuration

Each agent MUST have a configurable default LLM tier. The Orchestrator SHOULD use `boost` by default; sub-agents MAY use lower tiers.

#### Scenario: Orchestrator uses configured tier

- GIVEN `ORCHESTRATOR_TIER=mid` is set in the environment
- WHEN the Orchestrator initializes
- THEN it resolves its model from the `mid` tier of the provider registry

#### Scenario: Sub-agent uses its own tier

- GIVEN `ECHO_AGENT_TIER=free` is set in the environment
- WHEN echo-agent initializes
- THEN it uses the `free` tier model, independent of the Orchestrator's tier

---

## Capability: provider-registry

### Requirement: Tier-Based Model Resolution

The provider registry MUST export a `getModel(tier)` function that returns a model instance for the given tier. Valid tiers are: `free`, `mid`, `boost`, `premium`.

#### Scenario: Valid tier resolves a model

- GIVEN the registry is initialized with at least one provider key configured
- WHEN `getModel("boost")` is called
- THEN it returns a model instance compatible with the Vercel AI SDK

#### Scenario: No API keys configured (free tier fallback)

- GIVEN no API keys are set for any paid provider
- WHEN `getModel("free")` is called
- THEN it returns the Ollama local model or OpenRouter free-tier model
- AND no error is thrown at import time

#### Scenario: Requested tier has no configured provider

- GIVEN `ANTHROPIC_API_KEY` is not set
- WHEN `getModel("premium")` is called
- THEN it throws a descriptive `ProviderNotConfiguredError` with the missing env var name
- AND it does NOT silently return undefined

#### Scenario: Ollama is not running (free tier)

- GIVEN `OLLAMA_BASE_URL` is set but Ollama is not reachable
- WHEN an agent attempts a completion using the `free` tier
- THEN the AI SDK surfaces a network error
- AND the error message includes the Ollama base URL for diagnosis

### Requirement: OpenRouter Gateway Support

The registry SHOULD route `free` and `mid` tiers through OpenRouter as a unified gateway when `OPENROUTER_API_KEY` is set, bypassing the need for individual provider keys.

#### Scenario: OpenRouter replaces direct provider

- GIVEN `OPENROUTER_API_KEY` is set and no Groq/Anthropic keys are present
- WHEN `getModel("mid")` is called
- THEN it returns a model routed through OpenRouter
- AND the model ID is prefixed per OpenRouter's routing convention

---

## Capability: base-tools

### Requirement: Shared Tool Definitions

The system MUST provide five base tools available to all agents: `fileRead`, `fileWrite`, `fileEdit`, `bashExec`, `gitOps`. Each tool MUST be created with `createTool()` and MUST have Zod-validated input and output schemas.

#### Scenario: fileRead returns file contents

- GIVEN a file exists at the given path
- WHEN `fileRead` is invoked with `{ path: "/some/file.txt" }`
- THEN it returns `{ content: "<file contents>" }`

#### Scenario: fileRead on missing file

- GIVEN no file exists at the given path
- WHEN `fileRead` is invoked
- THEN it returns `{ error: "File not found: <path>" }` without throwing

#### Scenario: fileWrite creates or overwrites a file

- GIVEN a valid path and content string
- WHEN `fileWrite` is invoked with `{ path, content }`
- THEN the file is written and `{ success: true }` is returned

#### Scenario: bashExec runs an allowed command

- GIVEN dev mode is active (NODE_ENV=development)
- WHEN `bashExec` is invoked with `{ command: "echo hello" }`
- THEN it returns `{ stdout: "hello\n", exitCode: 0 }`

#### Scenario: bashExec blocked in production

- GIVEN `NODE_ENV=production` and the command is not on the allowlist
- WHEN `bashExec` is invoked with a non-allowlisted command
- THEN it returns `{ error: "Command not permitted in production" }`
- AND the command is NOT executed

#### Scenario: Zod input validation rejects bad input

- GIVEN a tool receives an input that does not match its Zod schema
- WHEN the tool is invoked
- THEN Mastra rejects the call before execution with a schema validation error

---

## Capability: daemon-runtime

### Requirement: Container Build

The system MUST provide a Dockerfile using `oven/bun` as the base image. The image MUST build successfully and the container MUST start the Mastra server on the configured port.

#### Scenario: Docker image builds

- GIVEN the Dockerfile is at the repo root
- WHEN `docker build -t delusion-swarm .` is executed
- THEN the build completes with exit code 0

#### Scenario: Container starts and serves health endpoint

- GIVEN the image has been built and env vars are injected via docker-compose
- WHEN `docker compose up` is executed
- THEN the container starts and `GET /health` returns HTTP 200 within 30 seconds

#### Scenario: Missing env vars at container start

- GIVEN a required env var (e.g. `OPENROUTER_API_KEY`) is absent
- WHEN the container starts
- THEN the process logs a clear error listing the missing variables
- AND it exits with a non-zero code rather than starting in a broken state

### Requirement: Health Endpoint

The runtime MUST expose a `GET /health` endpoint via Mastra's built-in HTTP server. The response MUST include a status field and SHOULD include uptime.

#### Scenario: Health check returns healthy status

- GIVEN the server is running and providers are configured
- WHEN `GET /health` is called
- THEN the response is `{ status: "ok", uptime: <seconds> }` with HTTP 200

#### Scenario: Health check during provider misconfiguration

- GIVEN a provider key is invalid but the server started
- WHEN `GET /health` is called
- THEN the response still returns HTTP 200 with `{ status: "ok" }`
- AND provider errors are only surfaced at request time, not startup

### Requirement: Environment-Based Configuration

All provider keys, tier defaults, port, and runtime flags MUST be read from environment variables. The project MUST ship a `.env.example` documenting every variable. Zero values MUST be hardcoded in source.

#### Scenario: .env.example is complete

- GIVEN `.env.example` exists at the repo root
- WHEN it is read
- THEN every env var referenced in source code has a corresponding entry with a comment

#### Scenario: Runtime starts with only .env.example values copied

- GIVEN `.env` is a direct copy of `.env.example` with no values filled in
- WHEN `bun dev` is executed
- THEN the process starts (possibly with degraded functionality) but does NOT crash on import
- AND it logs which providers are unconfigured
