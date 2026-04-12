---
status: proposed
created: 2026-04-07
updated: 2026-04-07
---

# Change Proposal: Forge Agent Implementation

## 1. Intent and Value
**What are we trying to achieve?**
We need to implement the "Forge Agent" — the highly mechanical, low-cost (Tier: free) AI agent responsible for the initial assembly of websites. It consumes natural language requirements, searches for available UI components (via `@delusion/blocks`), and generates a deterministic `delusion.json` configuration file. 
This keeps token costs exponentially lower compared to generating raw HTML/CSS.

**Why is this valuable?**
This is the heart of the "Token Economy" strategy. By having a specialized agent that ONLY writes JSON configurations using pre-defined schema and pre-built blocks, we eliminate HTML hallucinations, guarantee DaisyUI/Tailwind compliance, and reduce API costs by ~90% for typical site generation.

## 2. Scope
**In Scope:**
- `swarm/src/mastra/agents/forge.ts`: The agent definition running on `free` or `mid` tier.
- Agent system prompt directing it to use `search-blocks` and `register-project`.
- Integration of the Forge agent into `swarm/src/mastra/index.ts` and `orchestrator.ts`.
- Validation that the agent writes valid `delusion.json` structures.

**Out of Scope:**
- Implementation of the Maintainer Agent (complex iteration).
- Next.js frontend or Admin Panel.
- Continuous deployment (Deployer agent will handle this in another change).

## 3. Approach
1. **Agent Definition**: Create the Mastra agent targeting the global `CostMode` clamped tier (default `free`). 
2. **Tools**: Assign `search-blocks` and `register-project` natively to this agent.
3. **Prompting**: 
   - Inform the agent of the `delusion.json` schema.
   - Instruct the agent to strictly search blocks first.
   - Generate properties matching the block schema.
   - Return the JSON structure payload without markdown codeblocks or wrap them appropriately to be extracted by a deterministic parser.
4. **Integration**: Link it under the orchestrator.

## 4. Risks and Open Questions
- **Risk**: The Forge agent might hallucinate block properties.
  **Mitigation**: It must invoke `search-blocks` to get the strict `props` schema. If the output fails Zod validation on our deterministic pipeline, the Orchestrator can prompt the Forge to fix the errors.
- **Risk**: Cost constraints force it down to an Ollama LLM which struggles with JSON.
  **Mitigation**: If Ollama consistently fails, the system automatically falls back to OpenRouter's `free` models (like Gemini Pro or Gemma 2 27B) which are excellent at JSON.

## 5. Rollback Plan
- Revert `orchestrator.ts` to only include the echo agent.
- Remove `forge.ts`.
