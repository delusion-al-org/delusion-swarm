---
status: proposed
created: 2026-04-07
updated: 2026-04-07
---

# Change Proposal: Unified Swarm Architecture & Astro Parametrization

## 1. Intent and Value
**What are we trying to achieve?**
We are integrating Miguel's "Intelligence Layer" definitions with Diego's "Astro Parametrization & Strategic Notes" into a single cohesive architecture. The goal is a $0-cost operational baseline that uses Mastra as the AI Runtime, Supabase for tenant management/webhooks, and a system of specialized agents (Forge, Scout, Maintainer) interacting with parametrized Astro seeds.

**Why is this valuable?**
By unifying both visions, we achieve extreme scalability. The "Ejected Tenant" philosophy guarantees zero lock-in for clients, while the strictly typed `delusion.json` schema and DaisyUI theming keep the "Forge Agent" (Tier: Free) from hallucinating UI code. Meanwhile, the parallelized "Maintainer Agency" acts as the Librarian, using Engram memory to identify repeating tenant patterns and abstracting them into the core `@delusion/blocks` library.

## 2. Scope
**In Scope:**
- **Agent Runtime**: Standardize on Mastra (TypeScript, supervisor patterns) running Forge and Maintainer workflows.
- **Tenant Management**: Supabase handles tenant registry, billing, and triggers Mastra workflows via Edge Functions upon tenant updates.
- **Seed System**: Transform `seeds/restaurant` into `seed-landing` (a meta-seed) completely driven by `delusion.json` content ingestion via Astro Content Collections and Zod.
- **Component Evolution**: "Judge B" in the Maintainer Agency acts as the Librarian, connected to Engram MCP to detect custom components that should be abstracted into base libraries.
- **SEO Agent Concept**: Native `astro-seo` dynamically fed by the JSON config. Future rollout of a dedicated SEO agent.
- **Robust Meta-seeds & Versioning**: Core meta-seeds and `@delusion/blocks` will be built with SOTA models to ensure extreme robustness. Meta-seeds will be strictly versioned (e.g., published via NPM). We will track which seed version each tenant uses, allowing global backward-compatible upgrades and processing Agent/Librarian PR proposals to improve the core seeds.

**Out of Scope:**
- Building the actual UI for the admin panel.
- Raw HTML/CSS coding by the Forge agent (it must strictly write JSON config mapping to existing blocks).

## 3. Approach
1. **Core Runtime Setup**: Deploy Mastra with the base Orchestrator, listening to Supabase edge triggers.
2. **Implement Forge (JSON purely)**: Equip the Forge agent with the `delusion.json` schema. Instruct it to pair LLM reasoning strictly with structured output to configure `seed-landing`.
3. **Parametrize Astro**: Connect `seed-landing` BaseLayout and `index.astro` to consume data strictly from the injected `delusion.json` Zod collection. Use DaisyUI for token-efficient theming.
4. **Implement Maintainer Agency**: Create the Mastra Workflow containing Planner, Coder, and Judge B (Librarian with MCP memory access) for iterative tenant modifications.

## 4. Risks and Open Questions
- **Risk**: OpenRouter/Ollama cost limitations failing to write valid JSON.
  **Mitigation**: Enforce deterministic validation using Zod; Orchestrator auto-prompts corrections or upgrades the model tier to Claude/Gemini if needed.
- **Risk**: MCP connection complexity inside Mastra for the Librarian.
  **Mitigation**: Mastra allows native tool wrapping; we will wrap the standard SQLite Engram DB as native Mastra tools for Judge B.

## 5. Rollback Plan
- Revert changes to `seeds/restaurant` layout.
- Dismiss the `feat/intelligence-layer` branch workflows.
