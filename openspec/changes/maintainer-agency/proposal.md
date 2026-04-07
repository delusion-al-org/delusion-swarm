---
status: proposed
created: 2026-04-07
updated: 2026-04-07
---

# Change Proposal: The Maintainer Agency Workflow

## 1. Intent and Value
**What are we trying to achieve?**
We need to evolve the "Maintainer" from a single overwhelmed agent into a robust, parallelized **Mastra Workflow** functioning as a "Professional AI Agency". It must safely handle complex client alterations, reduce context limits, and identify patterns across projects using Engram memory.

**Why is this valuable?**
If a single LLM attempts to plan, code, test, and commit a large feature, it will hallucinate and enter an infinite retry loop. By parallelizing the workflow and isolating concerns (Planner, Coder, Judge A, Judge B), we guarantee zero regressions and exponential self-improvement via abstracted `@delusion/blocks`.

## 2. Scope
**In Scope:**
- Creation of `Maintainer Workflow` utilizing Mastra's Workflow API.
- Sub-agents: `Planner`, `Coder`, `Reviewer`.
- Judge B protocol for global abstraction using MCP Engram tools.
- `warn_admins` fallback tool.
- Passing `multi_replace_file_content` tools to the `Coder` to avoid 100% token rewrites.

**Out of Scope:**
- Automatic production deployments (handled by future Deployer agent).
- Complex runtime debugging of user's custom Next.js logic.

## 3. Approach
1. Define the Swarm via `Workflow` in Mastra.
2. Provide the `Coder` with specific File/AST editing tools (simulating `multi_replace_file_content`).
3. Connect `Judge B` to the Engram MCP client so he can perform `mem_search` and `mem_save`.
4. The workflow is triggered by `Orchestrator` when a webhook from Supabase detects an `update` on a registered project.

## 4. Risks and Open Questions
- **Risk**: Setting up an internal MCP client inside Mastra could be slightly complex.
   **Mitigation**: We can use Mastra's native tool capabilities to write wrapper functions around the standard SQLite Engram DB.
- **Risk**: Cost explosions if the Workflow loops infinitely.
  **Mitigation**: Enforce a strict `maxIterations: 3` limit. If it fails, trigger `warn_admins`.
