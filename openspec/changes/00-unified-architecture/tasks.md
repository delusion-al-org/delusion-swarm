# Tasks: Unified Swarm Architecture & Astro Parametrization

## Phase 1: Foundation & Astro Seed Parametrization
- [x] 1.1 Create `seeds/restaurant/src/content/config.ts` exporting `z.object` for `delusion.json` adhering to spec `REQ-02`.
- [x] 1.2 Modify `seeds/restaurant/src/layouts/BaseLayout.astro` to import Astro Content Collections and inject `astro-seo`.
- [x] 1.3 Refactor `seeds/restaurant/src/pages/index.astro` to map UI sections purely from `delusion.json`.
- [ ] 1.4 Test Astro build locally with mock JSON to ensure Zod strictly catches errors.

## Phase 2: Supabase Connectivity & Forge Agent
- [ ] 2.1 Set up `supabase/functions/webhook-mastra/index.ts` to capture DB `tenants` changes and send REST POST to Mastra endpoint (`REQ-01`).
- [ ] 2.2 Create `swarm/src/mastra/agents/forge.ts` configured with `delusion.json` schema to generate JSON strictly (`REQ-02`).
- [ ] 2.3 Integrate Forge in `swarm/src/mastra/orchestrator.ts` to receive UUIDs and write deterministic files to tenant repos.

## Phase 3: The Maintainer Agency (Creative Coders)
- [ ] 3.1 Scaffold `swarm/src/mastra/workflows/maintainer.ts` representing the parallel agency (Planner, Coder, Judge B).
- [ ] 3.2 Add file system/AST tools to the Coder prompt to authorize raw `.astro` file creation (`REQ-02 Creative Coders`).
- [ ] 3.3 Create Engram native MCP wrapper tools for Judge B to enable Librarian NPM upgrade pattern detection (`REQ-04`, `REQ-05`).

## Phase 4: Integration & E2E Validation
- [ ] 4.1 Mock the Supabase webhook curl locally; verify Orchestrator invokes Forge.
- [ ] 4.2 Send an explicitly custom requirement prompt to the Orchestrator. Verify it routes to the Maintainer Workflow and the Coder writes an actual file bypassing standard blocks.
- [ ] 4.3 Configure tenant `package.json` locking to explicit NPM meta-seed versions in the Forge clone logic (`REQ-04`).
