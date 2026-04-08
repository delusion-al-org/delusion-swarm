---
status: in-progress
created: 2026-04-07
updated: 2026-04-08
---

# Change Proposal: The Maintainer Agency Workflow

## 1. Intent and Value
**What are we trying to achieve?**
Evolve the "Maintainer" from a single overwhelmed agent into a robust, parallelized **Mastra Workflow** functioning as a "Professional AI Agency". It must safely handle complex client alterations, reduce context limits, and identify patterns across projects using Engram memory.

**Why is this valuable?**
If a single LLM attempts to plan, code, test, and commit a large feature, it will hallucinate and enter an infinite retry loop. By parallelizing the workflow and isolating concerns (Planner, Coder, Reviewer), we guarantee zero regressions and exponential self-improvement via abstracted `@delusion/blocks`.

## 2. Scope
**In Scope:**
- ✅ Creation of `Maintainer Workflow` utilizing Mastra's Workflow API.
- ✅ Sub-agents: `Planner`, `Coder`, `Reviewer`.
- ✅ `warn_admins` fallback tool.
- ✅ `multi_replace_file_content` tool with security sandbox.
- ⚠️ Judge B protocol for global abstraction using MCP Engram tools (stubs exist, real implementation pending).
- ❌ `dowhile` retry loop (Task 3.3).
- ❌ Orchestrator → Maintainer integration (Task 4.2).

**Out of Scope:**
- Automatic production deployments (handled by future Deployer agent).
- Complex runtime debugging of user's custom Next.js logic.

## 3. Approach
1. ✅ Define the Swarm via `Workflow` in Mastra.
2. ✅ Provide the `Coder` with specific File/AST editing tools (simulating `multi_replace_file_content`).
3. ⚠️ Connect `Judge B` to the Engram MCP client so he can perform `mem_search` and `mem_save` (stubs exist).
4. ❌ The workflow is triggered by `Orchestrator` when a webhook from Supabase detects an `update` on a registered project.

## 4. Risks and Open Questions
- **Risk**: Setting up an internal MCP client inside Mastra could be slightly complex.
   **Mitigation**: We can use Mastra's native tool capabilities to write wrapper functions around the standard SQLite Engram DB. **Update**: Direct SQLite via `better-sqlite3` is the simplest path for MVP.
- **Risk**: Cost explosions if the Workflow loops infinitely.
  **Mitigation**: Enforce a strict `maxIterations: 3` limit via Mastra's native `dowhile()`.
- **Risk (NEW)**: Node.js OOM under concurrent workflow executions.
  **Mitigation**: Dispatcher pattern — Orchestrator enqueues, Workers execute. Start with `.startAsync()`, migrate to Inngest/Trigger.dev at scale.
- **Risk (NEW)**: Path traversal bypassing the sandbox.
  **Mitigation**: Allowlist-based workspace anchoring + extension filtering.

## 5. Rollback Plan
All changes live on `feat/intelligence-layer`. If the Intelligence Layer causes instability:
1. Revert the branch — `factory-daemon-core` changes are unaffected
2. Orchestrator falls back to direct delegation (no workflow)
3. Forge continues operating independently
