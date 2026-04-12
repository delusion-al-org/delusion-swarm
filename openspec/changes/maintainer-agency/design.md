# Architecture Critique: The Intelligence Layer (Programming Team)

> **Last updated**: 2026-04-08 | **Status**: Partially implemented | **Branch**: `feat/intelligence-layer`

## 1. The Bottleneck of a Single "Maintainer" Agent
**Current thought**: A single `maintainer` agent handles iteration.
**Critique**: This clashes with the vision of a "Professional AI Agency". A single agent trying to plan, write code, run tests, and commit will hit context limits and loop infinitely (as seen in previous historical trading swarm issues).
**Solution**: ✅ **IMPLEMENTED** — The "Maintainer" is now a **Mastra Workflow** (`workflows/maintainer.ts`) that orchestrates three specialized agents:
- **Planner Agent** (`planner.ts`): Analyzes the request, reads context, creates a checklist. Queries Engram for "Golden Action Recipes".
- **Coder Agent** (`coder.ts`): Executes edits via `multi_replace`. Strict token economy, `free` tier.
- **Reviewer Agent** (`reviewer.ts`): Judgment Day Protocol — Judge A (Correctness) + Judge B (Abstraction).

**Security**: `codeStep` has a circuit breaker. If `planStep` detects core files (`src/mastra/`, `openspec/`), the workflow aborts with `SECURITY_HALT`.

## 2. The Retry Loop (IMPROVEMENT NEEDED)

**Status**: ❌ Not yet implemented (Task 3.3)

**Current**: Steps execute linearly: `plan → code → review`. If review rejects, the workflow ends.

**Recommended**: Use Mastra's native `.dowhile()` to create a deterministic retry loop:
```typescript
maintainerWorkflow
  .then(planStep)
  .dowhile(
    codeReviewSubWorkflow,
    ({ context }) => {
      const review = context.getStepResult('reviewStep');
      return review.status === 'REJECT' && review.iteration < 3;
    }
  );
```

**Why native `dowhile` over manual retry logic**:
- The execution graph becomes **observable** and **serializable** by Mastra
- Time-travel debugging works (you can pause, inspect state, and resume)
- Mastra can persist the graph state to storage for crash recovery

## 3. Memory: Engram vs `.delusion/context.md` per Project

**Solution**: ✅ **ARCHITECTURE CONFIRMED** — Dual memory system:
- **Central Engram**: Cross-project skills, Golden Action Recipes, generalized patterns
- **Local `.delusion/context.md`**: Client-specific state, git-versioned, human-readable

**⚠️ GAP**: The Engram tools inside Mastra (`mem-search.ts`, `mem-save.ts`) are **STUBS**. They log to console but don't connect to the real database. This must be implemented before the system can learn.

## 4. Tool Ecosystem & Self-Improvement (Golden Action Recipes)

**Solution**: ✅ **ARCHITECTURE CONFIRMED** — Instead of agents modifying Mastra tools at runtime:
1. Judge B identifies brilliant solutions and abstracts the **editing pattern** (not just the code).
2. Pattern saved to Engram as a "Golden Action Recipe" with exact diff templates.
3. Future Planner queries Engram, discovers the Recipe, and passes it to Coder.
4. Coder executes mechanically → near-zero reasoning tokens for known operations.

**⚠️ IMPROVEMENT**: Judge B should run **asynchronously** after the main workflow completes (see §6 below).

## 5. Claude Code-Style Prompting

**Status**: ✅ **IMPLEMENTED** — The Programming Team has specific tools:
- `multi_replace`: AST-like diff editing (90% token reduction)
- `read-context` / `update-context`: Project awareness
- `warn_admins`: Escalation circuit breaker
- `memSearch` / `memSave`: Engram connectivity (stubs)

## 6. Judge B as Async Post-Mortem (NEW — IMPROVEMENT)

**Problem**: Running Judge B (Abstraction/Generalization) synchronously inside `reviewStep` means:
- Client pays for the swarm's internal learning time
- Workflow duration increases by 30-60s per review
- Timeout risk in edge function / webhook contexts

**Solution**: Split the Reviewer into two phases:
1. `reviewStep` = **Judge A only** (correctness validation, fast, ~10s)
2. On `APPROVE` → emit a Mastra pub/sub event
3. Async consumer runs **Judge B** silently in the background
4. Judge B saves Golden Recipes to Engram without blocking the client

## 7. Supabase State Machine

**Workflow**:
1. `Supabase` triggers a webhook when a client requests a feature.
2. Orchestrator reads Supabase.
3. Looks up the repo, pulls latest commits.
4. Reads `.delusion/context.md` (which knows exactly where it left off).
5. Kicks off the Programming Team Workflow.
6. Team finishes, pushes to Git, updates `context.md`, updates Supabase status to `completed`.

## 8. Sandbox Hardening (NEW — IMPROVEMENT)

**Current guard**: Blocklist check for `src/mastra` and `openspec/` in path strings.

**Weaknesses identified**:
- Path traversal (`../../../etc/passwd`) bypasses the check
- No file extension filtering (agents could edit `.env`, `.key`, `docker-compose.yml`)
- No workspace root anchoring

**Recommended**: Allowlist-based sandbox:
1. Define `AGENT_WORKSPACE` env var as the only writable directory
2. Resolve all paths and verify they start with the workspace root
3. Allow only safe extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.html`, `.md`, `.json`, `.astro`
4. Reject all symlinks (prevent escape via symlink following)

## 9. Job Queue Architecture (NEW — IMPROVEMENT)

**Problem**: `orchestrator.ts` currently would call `maintainerWorkflow.execute()` in-process. 10 concurrent requests = 10 LLM streams = OOM in Node.js.

**Solution**: Orchestrator becomes a **Dispatcher**:
```
Supabase Webhook → Orchestrator (lightweight) → Job Queue → Worker Pool
                                                              ↓
                                                    maintainerWorkflow.execute()
```

**Options evaluated**:
| Solution | Pros | Cons |
|----------|------|------|
| **Inngest** | Serverless, event-driven, perfect for Mastra | Vendor dependency |
| **Trigger.dev** | OSS, good DX | Requires self-hosting |
| **BullMQ + Redis** | Battle-tested, self-hosted | Redis infrastructure |
| **Mastra `.startAsync()`** | Zero infra | No queue persistence, no retries |

**Recommendation**: Start with Mastra `.startAsync()` for MVP, migrate to Inngest/Trigger.dev when concurrent load exceeds 5 simultaneous workflows.
