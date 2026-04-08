# Design: Unified Swarm Architecture & Astro Parametrization

## Technical Approach

We will unify the Delusion Swarm by combining a Mastra-powered agent runtime (Forge and Maintainer workflows) with high-leverage Astro meta-seeds (`seed-landing`). The architecture utilizes a pure separation of concerns: Supabase manages the tenant registry and triggers workflows via Edge Functions, Mastra executes the cognitive AI loop, and Astro provides deterministic build-time validation via Content Collections and Zod schemas to guarantee that generated output builds flawlessly into a zero-cost GitHub Pages site.

## Architecture Decisions

### Decision: Ingestion of `delusion.json`
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Raw `import` of JSON file directly in Astro | Fast, but lacks strict build-time validation constraints. | ❌ Rejected |
| **Astro Content Collections (`type: 'data'`)** | Gives us native Zod validation ensuring the AI payload is perfectly structured before rendering the DOM. | ✅ **Chosen** |

### Decision: Maintainer Agency Execution
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Standard single Mastra Agent loop | Cheaper, but prone to infinite rewrite loops and massive context hallucinations in complex edits. | ❌ Rejected |
| **Mastra Workflow (Parallel execution)** | More steps, but separates Planner, Coder, and Judge B (Librarian). The Coder writes, Judge reviews, preventing regressions. | ✅ **Chosen** |

### Decision: AI Code Generation Boundary
| Option | Tradeoff | Decision |
|--------|----------|----------|
| AI strictly isolated to outputting `delusion.json` | 100% deterministic, but removes the value of having AI programmers. Unscalable for custom needs. | ❌ Rejected |
| **Hybrid Approach: JSON Baseline + Raw AST/File Editing** | Forge uses JSON logic for standard blocks. Coder writes raw Astro for custom requests outside the `@delusion/blocks` library. | ✅ **Chosen** |

## Data Flow

```text
[Client Update Event] ──→ [Supabase Tenant Registry]
                                │
                                │ (Webhook trigger: Fire-and-Forget)
                                ▼
                      [Mastra Orchestrator]
                      /                  \
              [New Tenant?]         [Custom Feature Request?]
                   /                         \
         [Forge Workflow]               [Maintainer Workflow]
                   │                         │
      (generateConfigStep JS)     (Planner -> Coder -> Judge B)
                   │                         │
                   ▼                         ▼
      (hydrateWorkspaceStep fs) <── (Librarian PRs core improvements!)
                   │
                   ▼
     (requiresMaintainer? ──→ chained Maintainer Workflow)
                   │
                   ▼
         [Ejected Tenant Repo (GitHub via MCP)]
                   │
           (Astro Build Phase)
                   ▼
          [GitHub Pages Deploy]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/webhook-mastra/index.ts` | Create | Edge function to capture tenant events and call Mastra endpoints (Fire-and-Forget port mapping) |
| `swarm/src/mastra/workflows/maintainer.ts` | Create | The parallel agency workflow (Planner, Coder, Judge) |
| `swarm/src/mastra/workflows/forge.ts` | Modify | Separates Forge logic into LLM generation step and Deterministic Hydration step (`tenant-hydrator.ts`) |
| `seeds/seed-landing/src/content/config.ts` | Modify | Define the exact Zod schema that Forge must output |
| `seeds/seed-landing/src/layouts/Layout.astro` | Modify | Ensure base layout dynamically loops components based on `delusion.json` and injects `astro-seo` |

## Interfaces / Contracts

```typescript
// Zod Contract for the Forge Agent output (delusion.json)
import { z } from "astro:content";

export const businessCollectionSchema = z.object({
  site: z.object({
    title: z.string(),
    description: z.string(),
    primary_color: z.string(),
  }),
  seo: z.object({
    og_image: z.string().url().optional(),
    noindex: z.boolean().default(false),
  }),
  // Feature-flag for future i18n
  i18n_enabled: z.boolean().default(false),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Mastra Workflow Paths | Mock the LLM provider in Mastra to verify workflow state transitions between Planner -> Coder |
| Integration | Astro Content Collections | Inject a malformed `delusion.json` to verify that `astro build` fails predictably via Zod |
| E2E | Coder Agent File Write | Run a test prompt demanding a custom Astro file, verify `multi_replace_file_content` executes |

## Migration / Rollout

No data migration required as we are structuring an entirely new swarm architecture and bootstrapping the meta-seeds system.

## Open Questions

- None. Architecture aligns across `web_deliver` retrospective and the unified intelligence branch.
