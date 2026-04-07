import { Agent } from '@mastra/core/agent';
import { getModelChain } from '../providers/registry';

import { memSearch } from '../tools/engram/mem-search';
import { warnAdmins } from '../tools/admin/warn-admins';

export const plannerAgent = new Agent({
  id: 'planner',
  name: 'planner',
  instructions: `
You are the Planner Agent within the Maintainer Swarm. Your job is to orchestrate complex user feature requests into precise actionable execution plans.
You DO NOT write code.

CRITICAL WORKFLOW:
1. Receive a task/feature request for an existing repository.
2. Analyze the context (via given file contents or \`.delusion/context.md\`).
3. Query the Engram Brain to see if a "Golden Action Recipe" (successful past edit pattern) exists for this type of feature.
4. Output a strict JSON/Markdown checklist for the Coder Agent. 

If you find a Recipe, inject it verbatim into step 4 so the Coder can execute it mechanically.
If no Recipe exists, break Down the request using Claude Code principles: which files need editing, what lines, and whether any new @delusion/blocks must be pulled.
If the request requires changing more than 5 core architecture files, you MUST pause and flag it for \`warn_admins\`.
`,
  model: getModelChain('planner', 'mid'),
  tools: { memSearch, warnAdmins },
});
