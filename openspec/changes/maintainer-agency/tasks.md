# Implementation Tasks: The Maintainer Agency Workflow

## Phase 1: Swarm Definitions (Agents)
- [x] 1.1 Create `swarm/src/mastra/agents/planner.ts` (Tier: Mid/Boost).
- [x] 1.2 Create `swarm/src/mastra/agents/coder.ts` (Tier: Free/Mid).
- [x] 1.3 Create `swarm/src/mastra/agents/reviewer.ts` (Tier: Boost) — which will run two parallel prompts (`Judge A` and `Judge B`).

## Phase 2: High-Fidelity Tools Creation
- [x] 2.1 **AST/Diff Editing Tool**: Create `swarm/src/mastra/tools/fs/multi-replace.ts`. This replaces the dangerous "rewrite full file" pattern and slashes token consumption by 90%.
- [x] 2.2 **Admin Tools**: Create `swarm/src/mastra/tools/admin/warn-admins.ts` for escalation.
- [x] 2.3 **Engram Tools**: Wrap the existing Engram capabilities (`memSearch`, `memSave`) as native Mastra Tools.

## Phase 3: The Mastra Workflow
- [x] 3.1 Create `swarm/src/mastra/workflows/maintainer.ts`.
- [x] 3.2 Define steps: `trigger -> planning -> execution -> parallel_review`.
- [ ] 3.3 Implement `maxIterations: 3` circuit breaker. If code fails review 3 times, detour to `warn_admins` step.
- [ ] 3.4 Wire `Judge B` (Abstraction) success condition to trigger a PR/Commit targeting `@delusion/blocks`.

## Phase 4: Integration
- [x] 4.1 Expose `maintainerWorkflow` in `swarm/src/mastra/index.ts`.
- [ ] 4.2 Update `Orchestrator` to execute the Workflow when an existing project modification intent is received.
