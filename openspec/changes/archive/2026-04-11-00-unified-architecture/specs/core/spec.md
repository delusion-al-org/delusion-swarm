# Core Architecture Specification

## Purpose
Defines the specifications for the unified Delusion Swarm architecture, combining Mastra agent execution, Supabase triggers, Astro parametrized 'meta-seeds', and the Maintainer/Librarian pattern with strict NPM versioning.

## Requirements

### Requirement: REQ-01 Supabase Edge Triggers
The system MUST trigger a Mastra Workflow via a Supabase Edge Function whenever a tenant configuration record is inserted or updated in the central registry.

#### Scenario: New Tenant Registration
- GIVEN a new record inserted into the `tenants` table
- WHEN the Supabase webhook fires
- THEN the Edge Function MUST invoke the Mastra Orchestrator
- AND pass the tenant UUID and raw prompt data

### Requirement: REQ-02 Creative AI Coders (The Agency Heart)
The System's Coder agents MUST be capable of authoring custom logic, creating new components, and writing direct Astro/React code when necessary. The `delusion.json` configuration configures the baseline, but the agents MUST NOT be restricted to merely assembling pre-built blocks. Seeds and `@delusion/blocks` MUST act as high-leverage tools to optimize costs, not restrictive boundaries.

#### Scenario: Extending beyond the base seed
- GIVEN a client request that requires a custom "Booking Calendar" not present in `@delusion/blocks`
- WHEN the Coder agent processes the request
- THEN it MUST leverage the robust seed architecture (Auth, UI standards)
- AND dynamically write the custom Astro logic directly into the tenant's repository.

### Requirement: REQ-03 Astro Meta-Seed Data Ingestion
Meta-seeds (like `seed-landing`) MUST consume all tenant-specific data exclusively from `src/content/business/delusion.json` using Astro Content Collections.

#### Scenario: Site Build Process
- GIVEN a populated `delusion.json`
- WHEN `astro build` executes
- THEN Zod MUST validate the schema
- AND Astro layouts MUST inject SEO tags (`astro-seo`) and UI data deterministically

### Requirement: REQ-04 Meta-Seed Robustness & Versioning
Meta-seeds MUST be versioned and distributed via an NPM-like registry, ensuring that each generated tenant is tied to an explicit meta-seed version.

#### Scenario: Tracking tenant seed versions
- GIVEN the Forge Agent deploys a new tenant
- WHEN the tenant repository is initialized
- THEN the `package.json` or config MUST lock the specific meta-seed version used

### Requirement: REQ-05 Librarian Agent Upgrades
The 'Judge B' / Librarian Agent within the Maintainer Agency MUST be capable of creating Pull Requests to the core meta-seeds when successful, generalized component modifications are detected via Engram across different tenets.

#### Scenario: Discovering a repeating pattern
- GIVEN the Librarian detects that 10 tenants manually added a "Google Reviews Carousel"
- WHEN the Librarian analyzes the Engram memory
- THEN it MUST abstract the block into `@delusion/blocks`
- AND SHALL post a Pull Request to the core meta-seeds repository.
