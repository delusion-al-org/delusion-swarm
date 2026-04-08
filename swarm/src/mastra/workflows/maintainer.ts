import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { plannerAgent } from '../agents/planner';
import { coderAgent } from '../agents/coder';
import { reviewerAgent } from '../agents/reviewer';

// ═══════════════════════════════════════════════════════════
// SCHEMAS — shared between steps for type consistency
// ═══════════════════════════════════════════════════════════

const planOutputSchema = z.object({
  checklist: z.string(),
  containsCoreFiles: z.boolean(),
  featureRequest: z.string(),
});

const codeOutputSchema = z.object({
  repoState: z.string(),
  containsCoreFiles: z.boolean(),
  iteration: z.number(),
  checklist: z.string(),
});

const reviewOutputSchema = z.object({
  status: z.enum(['APPROVE', 'REJECT', 'ESCALATE', 'SECURITY_HALT']),
  feedback: z.string(),
  iteration: z.number(),
  checklist: z.string(),
});

// ═══════════════════════════════════════════════════════════
// STEP 1: PLAN — Planner Agent generates the execution plan
// ═══════════════════════════════════════════════════════════

const planStep = createStep({
  id: 'planStep',
  inputSchema: z.any(),
  outputSchema: planOutputSchema,
  execute: async (context: any) => {
    const featureRequest = (context.inputData as any)?.featureRequest || '';

    const res = await plannerAgent.generate(`Plan execution for: ${featureRequest}`);

    const isDangerous = res.text.includes('src/mastra') || res.text.includes('openspec/');

    return {
      checklist: res.text,
      containsCoreFiles: isDangerous,
      featureRequest,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 2: CODE — Coder Agent executes the plan
// ═══════════════════════════════════════════════════════════

const codeStep = createStep({
  id: 'codeStep',
  inputSchema: z.any(),
  outputSchema: codeOutputSchema,
  execute: async (context: any) => {
    // On first pass, input comes from planStep. On retry, from reviewStep.
    const input = context.inputData;
    const checklist = input?.checklist || '';
    const containsCoreFiles = input?.containsCoreFiles ?? false;
    const iteration = (input?.iteration ?? 0) + 1;

    if (containsCoreFiles) {
      return {
        repoState: 'ABORTED: Security boundary triggered. Plan contained core files.',
        containsCoreFiles: true,
        iteration,
        checklist,
      };
    }

    const feedback = input?.feedback || '';
    const prompt = feedback
      ? `Iteration ${iteration}: Fix the following issues and re-apply the plan.\nFeedback: ${feedback}\nOriginal plan: ${checklist}`
      : `Execute the following plan: ${checklist}`;

    await coderAgent.generate(prompt);

    return {
      repoState: `Executed changes (iteration ${iteration}). Diff ready for Review.`,
      containsCoreFiles: false,
      iteration,
      checklist,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 3: REVIEW — Judge A (Correctness only, synchronous)
// Judge B runs async post-mortem (see §6 in design.md)
// ═══════════════════════════════════════════════════════════

const reviewStep = createStep({
  id: 'reviewStep',
  inputSchema: z.any(),
  outputSchema: reviewOutputSchema,
  execute: async (context: any) => {
    const codeResult = context.inputData as {
      repoState: string;
      containsCoreFiles: boolean;
      iteration: number;
      checklist: string;
    };

    if (codeResult?.containsCoreFiles) {
      return {
        status: 'SECURITY_HALT' as const,
        feedback: 'Security circuit breaker tripped. Manual intervention required.',
        iteration: codeResult.iteration,
        checklist: codeResult.checklist,
      };
    }

    const res = await reviewerAgent.generate(
      `[Judge A — Correctness Review]\nIteration: ${codeResult.iteration}\nChanges: ${codeResult.repoState}\n\nValidate syntax, logic, and structural correctness. If good, say APPROVE. If not, say REJECT: <reason>.`
    );

    let status: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'SECURITY_HALT' = 'APPROVE';
    if (res.text.includes('REJECT')) status = 'REJECT';
    if (res.text.includes('ESCALATE')) status = 'ESCALATE';

    return {
      status,
      feedback: res.text,
      iteration: codeResult.iteration,
      checklist: codeResult.checklist,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 4: ESCALATION — warn_admins after 3 failed iterations
// ═══════════════════════════════════════════════════════════

const escalateStep = createStep({
  id: 'escalateStep',
  inputSchema: z.any(),
  outputSchema: z.object({
    status: z.literal('ESCALATED'),
    reason: z.string(),
    iterations: z.number(),
  }),
  execute: async (context: any) => {
    const input = context.inputData;
    console.error(`\n🚨 MAINTAINER WORKFLOW ESCALATION — Failed after ${input?.iteration || 3} iterations`);
    console.error(`Last feedback: ${input?.feedback || 'N/A'}\n`);

    return {
      status: 'ESCALATED' as const,
      reason: input?.feedback || 'Max iterations reached without approval',
      iterations: input?.iteration || 3,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 5: FINALIZE — Post-approval actions
// ═══════════════════════════════════════════════════════════

const finalizeStep = createStep({
  id: 'finalizeStep',
  inputSchema: z.any(),
  outputSchema: z.object({
    status: z.string(),
    summary: z.string(),
  }),
  execute: async (context: any) => {
    const input = context.inputData;

    // TODO: Emit pub/sub event here to trigger async Judge B
    // mastra.events.emit('workflow.approved', { diff: input.repoState });

    return {
      status: 'COMPLETED',
      summary: `Maintainer workflow completed after ${input?.iteration || 1} iteration(s). Changes approved.`,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// SUB-WORKFLOW: Code → Review loop (used by dountil)
// ═══════════════════════════════════════════════════════════

const MAX_ITERATIONS = 3;

const codeReviewLoop = createWorkflow({
  id: 'code-review-loop',
  inputSchema: z.any(),
  outputSchema: reviewOutputSchema,
  steps: [codeStep, reviewStep],
})
  .then(codeStep)
  .then(reviewStep)
  .commit();

// ═══════════════════════════════════════════════════════════
// MAIN WORKFLOW: Plan → [Code ↔ Review]* → Finalize/Escalate
// ═══════════════════════════════════════════════════════════

export const maintainerWorkflow = createWorkflow({
  id: 'maintainer-agency',
  inputSchema: z.object({
    featureRequest: z.string().optional(),
  }),
  outputSchema: z.any(),
  steps: [planStep, codeReviewLoop, escalateStep, finalizeStep],
});

maintainerWorkflow
  .then(planStep)
  .dountil(
    codeReviewLoop,
    async ({ inputData }: any) => {
      // Stop looping when: APPROVE, SECURITY_HALT, ESCALATE, or max iterations
      const status = inputData?.status;
      const iteration = inputData?.iteration ?? 0;
      return status !== 'REJECT' || iteration >= MAX_ITERATIONS;
    }
  )
  .branch([
    // Branch 1: Approved → Finalize
    [
      async ({ inputData }: any) => inputData?.status === 'APPROVE',
      finalizeStep,
    ],
    // Branch 2: Failed / Max iterations → Escalate
    [
      async ({ inputData }: any) => inputData?.status !== 'APPROVE',
      escalateStep,
    ],
  ])
  .commit();
