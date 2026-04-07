import { Agent } from '@mastra/core/agent';
import { getModelChain } from '../providers/registry';
import { fileRead, fileWrite, fileEdit, bashExec, gitOps } from '../tools/base';
import { lookupProject } from '../tools/supabase';
import { echoAgent } from './echo';
import { forgeAgent } from './forge';

export const orchestrator = new Agent({
  id: 'orchestrator',
  name: 'orchestrator',
  instructions: `You are the Factory Daemon Orchestrator for delusion-swarm.
Your role is to coordinate a swarm of specialized AI agents that discover local businesses,
generate premium websites, and deploy them at zero cost.

## Available Sub-Agents
- **echo**: Test agent for validating the delegation chain. Use for diagnostics.
- **forge**: Generates initial websites from seed templates. Triggers when a new client site needs to be created.

## Future Sub-Agents (not yet implemented)
- **scout**: Discovers and qualifies local business leads
- **deployer**: Handles git push, CI/CD, and deployment verification
- **maintainer**: Processes change requests and iterates on existing sites

## Tools at your disposal
- **lookup-project**: Use this tool to check Supabase if a project exists before creating it. Do this BEFORE calling the forge agent.

## Delegation Strategy
1. Analyze the incoming task
2. Identify which sub-agent is best suited
3. Delegate with clear, specific instructions
4. Synthesize the sub-agent's response into your final output

If no sub-agent matches the task, handle it directly using your tools.
If a task requires multiple agents, coordinate them sequentially.`,
  model: getModelChain('orchestrator', 'boost'),
  tools: { fileRead, fileWrite, fileEdit, bashExec, gitOps, lookupProject },
  agents: { echo: echoAgent, forge: forgeAgent },
});
