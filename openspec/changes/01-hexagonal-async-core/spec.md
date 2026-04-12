# Specification: Hexagonal Async Core

## Scope
- `swarm/src/mastra/adapters/`
  - `engram/` (sqlite, memory, http)
  - `queue/` (memory, bullmq)
- `swarm/src/mastra/lib/model-factory.ts`
- `swarm/src/mastra/index.ts` (Hono Server Extensions)

## Requirements
### `IEngramRepository`
Must define `save(obs: ObservationInput): Promise<{ id: number }>` for persistence decoupling. Supported modes selected via `ENGRAM_MODE`.

### `IJobQueue`
Must define `enqueue(data: any): Promise<string>`. The queue implementation must invoke the original Orchestrator workflow logic in a try-catch background process.

### `fetchWithRotation` 
Must capture Vercel AI SDK requests, rotate the Nvidia token sequentially, delay for 1200ms dynamically to respect NIM IP restrictions, and proceed to invoke Nim endpoints.

### E2E Testing
Must implement test suites running against the async webhook \`/api/async/dispatch\` to assert non-blocking API functionality.

### Engram Brain Tools
Must expose \`engram-save\` and \`engram-search\` tools to the orchestrator and sub-agents to allow them to persist architectural patterns and search for past solutions.
