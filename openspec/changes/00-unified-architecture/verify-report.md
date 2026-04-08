# SDD-Verify & Judgment Day Report
**Target**: Unified Swarm Architecture & E2E Wiring
**Mode**: Theoretical Adversarial Analysis

---

## 1. Judgment Day Verdict (Adversarial Flow Analysis)

| Finding | Severity | Description |
|---------|----------|-------------|
| **Destructive Re-Hydration** | CRITICAL | `tenant-hydrator.ts` uses `fs.cp()` to blind-copy the seed. If `forgeWorkflow` is re-triggered on an existing tenant, it will OVERWRITE any custom `.astro` code created by the Maintainer. |
| **Missing Handoff (Day 1 Features)** | CRITICAL | Forge outputs `custom_sections` in `delusion.json`. However, the Orchestrator does not check the output to trigger the Maintainer. The site hydrates with empty placeholders and the custom feature is never built. |
| **Edge Function Timeout Block** | CRITICAL | Supabase Edge Functions timeout after ~15s (standard). Mastra's LLM generation takes 20-40s. Awaiting the orchestrator in `webhook-mastra` will cause a 504 Gateway Timeout and crash the registry loop. |
| **Outdated Design Specs** | WARNING | `design.md` still refers to `seeds/restaurant` (deleted) and `Forge Agent` (now a workflow). |

---

## 2. SDD Compliance Matrix (Static Code vs Design)

| Requirement | Spec/Design Goal | Implementation Status | Notes |
|-------------|------------------|-----------------------|-------|
| REQ-01 | Tenant triggers via Supabase | ⚠️ Partial | Webhook exists, but it blocks execution leading to timeouts. |
| REQ-02 | Forge delegates to Maintainer | ❌ Failing | `custom_sections` schema exists, but orchestration pipeline drops the ball. |
| REQ-03 | Content Collections Zod Sync | ✅ Compliant | `delusion.json` strictly aligned with `astro:content`. |
| Architecture | Sandbox Core | ✅ Compliant | `multi-replace.ts` restricts Coder to `AGENT_WORKSPACE`. |

---

## 3. Proposed Fixes (The Action Plan)

1. **Hydrator Safety Lock**: Modify `tenant-hydrator.ts`. If `fs.stat` detects the target directory exists, skip the `fs.cp()` step and ONLY update `delusion.json`.
2. **Day-1 Feature Chaining**: Modify `forgeWorkflow` to emit `requiresMaintainer: boolean`. Update `orchestrator.ts` to parse the workflow output: if true, immediately trigger the `maintainerWorkflow`.
3. **Fire-and-Forget Webhook**: In `supabase/functions/webhook-mastra/index.ts`, remove the `await` for the `mastraResponse.json()` body. Just `fetch()` and immediately return `202 Accepted`.
4. **Update Specs**: Overhaul `design.md` to reflect the true Final Architecture (Forge as a Workflow, `seed-landing` as the unified base, and the fix integrations).

**JUDGMENT:** ESCALATED ⚠️
Theoretical bugs present. Codebase not cleared for execution.
Waiting for user approval to proceed with the surgical fix iteration.
