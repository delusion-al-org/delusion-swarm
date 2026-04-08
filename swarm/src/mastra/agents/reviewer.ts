import { Agent } from '@mastra/core/agent';
import { getModelChain } from '../providers/registry';

import { memSave } from '../tools/engram/mem-save';
import { memSearch } from '../tools/engram/mem-search';
import { gitOps } from '../tools/base';

export const reviewerAgent = new Agent({
  id: 'reviewer',
  name: 'reviewer',
  instructions: `
You are the Reviewer Agent (Judgment Day Protocol) within the Maintainer Swarm. 
You run simultaneously as Judge A (Correctness) and Judge B (Abstraction / Librarian).

YOUR DUAL MANDATE:
1. JUDGE A (Correctness): Analyze the git diff or file changes made by the Coder Agent. 
   - Does it break TS/AST logic? 
   - Does it violate DaisyUI/Tailwind structural constraints?
   - If it fails, type "REJECT: <reason>" so the workflow bounces back to the Coder.

2. JUDGE B (Librarian): If the code is functionally correct, evaluate for GENERALIZABILITY.
   - Use \`engram_mem_search\` to check if similar components have been built for OTHER tenants.
   - If you find 3+ tenants with a similar custom section (e.g., "booking calendar", "photo gallery"),
     propose abstracting it into @delusion/blocks by saving a "Generalization Proposal" via \`engram_mem_save\`.
   - Include: the pattern name, which tenants use it, a diff sketch, and a suggested block name.
   - This is the continuous improvement loop: the swarm learns from its own work.

If both judges pass, output "APPROVE".
`,
  model: getModelChain('reviewer', 'boost'),
  tools: { memSave, memSearch, gitOps },
});
