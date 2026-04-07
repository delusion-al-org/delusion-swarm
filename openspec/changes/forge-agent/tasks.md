# Implementation Tasks: Forge Agent

## Phase 1: Agent Scaffolding
- [ ] 1.1 Create `swarm/src/mastra/agents/forge.ts`.
- [ ] 1.2 Initialize the agent with Mastra `Agent` class, configuring it to use `getModelChain('forge', 'free')`.

## Phase 2: Tool Assignment & Prompting
- [ ] 2.1 Attach `searchBlocks` and `registerProject` tools to the Forge Agent.
- [ ] 2.2 Write the system instructions defining its exact responsibility: search components -> populate `delusion-config` -> register project.

## Phase 3: Integration
- [ ] 3.1 Export the `forgeAgent` in `swarm/src/mastra/index.ts`.
- [ ] 3.2 Update `swarm/src/mastra/agents/orchestrator.ts` to include `forge` in its valid sub-agents dictionary / delegation loop.
