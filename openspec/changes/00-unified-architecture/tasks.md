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
- [ ] 4.1 Mock Supabase webhook curl; verify Orchestrator invokes Forge.
- [ ] 4.2 Send custom requirement prompt; verify routing to Maintainer Workflow.
- [ ] 4.3 Configure tenant `package.json` locking to NPM seed versions (`REQ-04`).
