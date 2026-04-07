import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { plannerAgent } from '../agents/planner';
import { coderAgent } from '../agents/coder';
import { reviewerAgent } from '../agents/reviewer';

const planStep = createStep({
  id: 'planStep',
  inputSchema: z.any(),
  outputSchema: z.object({
    checklist: z.string(),
    containsCoreFiles: z.boolean(),
  }),
  execute: async (context: any) => {
    const featureRequest = (context.inputData as any)?.featureRequest || '';
    
    // Planner generates the action plan
    const res = await plannerAgent.generate(`Plan execution for: ${featureRequest}`);
    
    // Simulate detecting if the plan touches core files
    const isDangerous = res.text.includes('src/mastra') || res.text.includes('openspec/');
    
    return {
      checklist: res.text,
      containsCoreFiles: isDangerous,
    };
  },
});

const codeStep = createStep({
  id: 'codeStep',
  inputSchema: z.any(),
  outputSchema: z.object({
    repoState: z.string(),
    containsCoreFiles: z.boolean().optional(),
  }),
  execute: async (context: any) => {
    const plan = context.getStepResult('planStep') as { checklist: string; containsCoreFiles: boolean };
    
    if (plan?.containsCoreFiles) {
      return { repoState: 'ABORTED: Security boundary triggered. Plan contained core files.', containsCoreFiles: true };
    }
    
    const checklist = plan?.checklist || '';
    
    await coderAgent.generate(`Execute the following plan: ${checklist}`);
    
    return {
      repoState: 'Executed changes locally. Diff ready for Review.',
      containsCoreFiles: false
    };
  },
});

const reviewStep = createStep({
  id: 'reviewStep',
  inputSchema: z.any(),
  outputSchema: z.object({
    status: z.enum(['APPROVE', 'REJECT', 'ESCALATE', 'SECURITY_HALT']),
    feedback: z.string(),
  }),
  execute: async (context: any) => {
    const codeResult = context.getStepResult('codeStep') as { repoState: string, containsCoreFiles: boolean };
    
    if (codeResult?.containsCoreFiles) {
       return {
          status: 'SECURITY_HALT' as const,
          feedback: 'Security circuit breaker tripped. Manual intervention required.'
       };
    }
    
    const repoState = codeResult?.repoState || '';
    const res = await reviewerAgent.generate(`Review these changes: ${repoState}`);
    
    let status: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'SECURITY_HALT' = 'APPROVE';
    if (res.text.includes('REJECT')) status = 'REJECT';
    if (res.text.includes('ESCALATE')) status = 'ESCALATE';
    
    return {
      status,
      feedback: res.text,
    };
  },
});

export const maintainerWorkflow = new Workflow({
  id: 'maintainer-agency',
  inputSchema: z.any(),
  outputSchema: z.any(),
});

maintainerWorkflow
  .then(planStep)
  .then(codeStep)
  .then(reviewStep);

maintainerWorkflow.commit();
