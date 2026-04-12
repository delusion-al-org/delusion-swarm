# 01-hexagonal-async-core

## Intent
Evolve the unified architecture of the Master-Daemon and Swarm workflows into a fully asynchronous, production-hardened system capable of surviving multi-day generation tasks, HTTP timeouts, and strict Nvidia proxy rate-limits. Integrate Hexagonal Architecture (Ports and Adapters) into the persistence mechanisms.

## Context
During initial E2E tests of the \`Maintainer\` and \`Forge\` workflows, the Vercel AI SDK synchronously spun up parallel LLM generation tasks. This aggressive behavior caused two catastrophic pipeline failures:
1. **API Rate Limiting:** Nvidia NIM free-tier restricts keys to roughly 160 RPM. Mastra would burn through 40+ requests per second internally, instantly crashing the workflow with `429 Too Many Requests`.
2. **HTTP 504 Gateway Timeouts:** Orchestrator executions running sequentially caused webhooks to stay open for minutes.

## Proposed Changes

### 1. Hexagonal Persistence (Engram Adapters)
- Decouple the \`swarms/engram\` database direct calls into an \`IEngramRepository\` port.
- Implement Adapters for:
  - **SQLite:** \`.engram-storage/engram.db\` for local offline persistence.
  - **HTTP:** For production boundary isolation.
  - **Stub:** For CI/CD mocking.

### 2. Async Job Queue (Fire and Forget)
- Introduce a queue layer (`IJobQueue`) to instantly release incoming Orchestrator HTTP Webhooks with a \`202 Accepted\`.
- Implement a \`BullMQAdapter\` (Redis-based for production) and \`MemoryQueueAdapter\` (for dev) to handle workflow executions asynchronously in the background.
- Divert all heavy Orchestrator payloads to \`/api/async/dispatch\`.

### 3. Deep-Thought Logger Subsystem
- Since the process runs in the background, intercept LLM Agent logs during processing and dump them into \`scripts/logs/async-job-{timestamp}.log\`.

### 4. Custom Fetch Rotator (Vercel SDK Override)
- Implement \`fetchWithRotation\` overriding the native \`fetch\` interface within the OpenAI configuration boundary.
- **Rotation:** Cycle sequentially across the \`NVIDIA_API_KEY\` array to balance weight.
- **Throttling:** Actively suspend the event loop by 1200ms per agent execution, completely negating 429 errors from parallel internal iterations.

## Impact
- Unblocks UI Block Generation ("Seeds by Diego") from failing during hydration/design injection over massive codebases.
- Allows the swarm to autonomously recover and document edge cases to Engram memory correctly.
- Prepares the Swarm factory for deployment with \`BullMQ/Redis\` in the production \`docker-compose.yml\`.
