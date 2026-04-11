# Tasks: Unified Swarm Architecture & Astro Parametrization

## Phase 1: Foundation & Astro Seed Parametrization
- [x] 1.1 Create `seeds/seed-landing/src/content/config.ts` with Zod schema for `delusion.json` (`REQ-03`).
- [x] 1.2 Modify `seeds/seed-landing/src/layouts/Layout.astro` — Content Collections + `astro-seo` (`REQ-03`).
- [x] 1.3 Refactor `seeds/seed-landing/src/pages/index.astro` — all content from `delusion.json`.
- [x] 1.4 Test Astro build locally — **PASSED** (Zod validates, SEO meta tags injected correctly).

## Phase 2: Supabase Connectivity & Forge Agent
- [x] 2.1 Set up `supabase/functions/webhook-mastra/index.ts` for tenant change triggers (`REQ-01`).
- [x] 2.2 Update `swarm/src/mastra/agents/forge.ts` — allow `custom_sections` for features beyond blocks (`REQ-02`).
- [x] 2.3 Extend `swarm/src/mastra/schemas/delusion-config.ts` — add `seo`, `custom_sections`, `seed.version`, `i18n_enabled` (`REQ-04`).
- [x] 2.4 Create `tenant-hydrator.ts` tool to bridge Force JSON output to Astro local workspace provisioning.

## Phase 3: The Maintainer Agency (Creative Coders)
- [x] 3.1 Maintainer workflow already scaffolded by Miguel (Planner → Coder → Reviewer).
- [x] 3.2 Coder agent already has file system tools for raw `.astro` creation (`REQ-02`).
- [x] 3.3 Enhanced Reviewer as Librarian with `memSearch` for cross-tenant pattern detection (`REQ-05`).

## Phase 4: Integration & E2E Validation
- [x] 4.0 Fix Mastra v1.22 workflow API: `createWorkflow` with `id`/`inputSchema`/`outputSchema`, `inputData` in steps, `.then()` chaining — server boots cleanly.
- [ ] 4.1 Mock Supabase webhook curl; verify Orchestrator invokes Forge.
- [ ] 4.2 Send custom requirement prompt; verify routing to Maintainer Workflow.
- [x] 4.3 NPM-based seed resolution (`REQ-04`) — `tenant-hydrator.ts` resolves seeds via `npm install @delusion/seed-{template}@{version}` (SEED_RESOLVE_MODE=npm) or local fallback for dev. Version locked in `package.json` with full provenance.

## Phase 5: Hardening
- [x] 5.1 Fix Forge agent instructions — removed misleading `hydrate-project` tool reference.
- [x] 5.2 Fix `eject-github.ts` token security — use `GIT_CONFIG` env vars instead of embedding token in remote URL.
- [x] 5.3 Fix `multi-replace.ts` sandbox — path segment matching instead of string includes.
- [x] 5.4 Add `planner`, `coder`, `reviewer` roles to cost mode caps in provider registry.

## Phase 6: Execution Gap Closure
- [x] 6.1 Created `triggerForge` and `triggerMaintainer` wrapper tools bridging Agent↔Workflow gap (GAP-01).
- [x] 6.2 Registered `forgeAgent` in Mastra `agents` map (was imported but never registered).
- [x] 6.3 Fixed `webhook-mastra/index.ts` template literal syntax errors (GAP-06).
- [x] 6.4 Updated Orchestrator instructions to reference actual tool names (`trigger-forge`, `trigger-maintainer`).
- [x] 6.5 Schema convergence verified — `seed-landing/content/config.ts` already matches `delusionConfigSchema` (Diego fixed this).
- [x] 6.6 Created `blocks-manifest.json` (3 blocks: Hero, Menu, Contact) + `scripts/build-block-manifest.ts` build script.
