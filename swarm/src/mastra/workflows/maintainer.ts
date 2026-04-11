import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { plannerAgent } from '../agents/planner';
import { coderAgent } from '../agents/coder';
import { reviewerAgent } from '../agents/reviewer';
import { distillerAgent } from '../agents/distiller';
import { getEngramRepository } from '../adapters/engram';

// ═══════════════════════════════════════════════════════════
// SCHEMAS — shared between steps for type consistency
// ═══════════════════════════════════════════════════════════

const planOutputSchema = z.object({
  checklist: z.string(),
  containsCoreFiles: z.boolean(),
  featureRequest: z.string(),
  projectPath: z.string().optional(),
});

const codeOutputSchema = z.object({
  repoState: z.string(),
  containsCoreFiles: z.boolean(),
  iteration: z.number(),
  checklist: z.string(),
  projectPath: z.string().optional(),
});

const reviewOutputSchema = z.object({
  status: z.enum(['APPROVE', 'REJECT', 'ESCALATE', 'SECURITY_HALT']),
  feedback: z.string(),
  iteration: z.number(),
  checklist: z.string(),
  projectPath: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════
// STEP 1: PLAN — Planner Agent generates the execution plan
// ═══════════════════════════════════════════════════════════

const planStep = createStep({
  id: 'planStep',
  inputSchema: z.object({
    featureRequest: z.string().optional(),
    projectPath: z.string().optional().describe('Absolute path to the tenant workspace'),
  }),
  outputSchema: planOutputSchema,
  execute: async ({ inputData }) => {
    const featureRequest = inputData?.featureRequest || '';
    const projectPath = inputData?.projectPath || '';
    const projectCtx = projectPath ? `\nTarget Project Path: ${projectPath}. Use your tools to read the context and files from this directory.` : '';

    const res = await plannerAgent.generate(`Plan execution for: ${featureRequest}${projectCtx}`);

    const isDangerous = res.text.includes('src/mastra') || res.text.includes('openspec/');

    return {
      checklist: res.text,
      containsCoreFiles: isDangerous,
      featureRequest,
      projectPath,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 2: CODE — Coder Agent executes the plan
// ═══════════════════════════════════════════════════════════

const codeStep = createStep({
  id: 'codeStep',
  inputSchema: z.object({
    checklist: z.string(),
    containsCoreFiles: z.boolean(),
    featureRequest: z.string().optional(),
    feedback: z.string().optional(),
    iteration: z.number().optional(),
    projectPath: z.string().optional(),
  }),
  outputSchema: codeOutputSchema,
  execute: async ({ inputData }) => {
    const checklist = inputData?.checklist || '';
    const containsCoreFiles = inputData?.containsCoreFiles ?? false;
    const iteration = (inputData?.iteration ?? 0) + 1;
    const projectPath = inputData?.projectPath || '';

    if (containsCoreFiles) {
      return {
        repoState: 'ABORTED: Security boundary triggered. Plan contained core files.',
        containsCoreFiles: true,
        iteration,
        checklist,
        projectPath,
      };
    }

    const feedback = inputData?.feedback || '';
    const promptPath = projectPath ? `\nTarget Project Path: ${projectPath}\nAll file reads and multi-replace paths must be absolute based on this path.` : '';
    const prompt = feedback
      ? `Iteration ${iteration}: Fix the following issues and re-apply the plan.\nFeedback: ${feedback}\nOriginal plan: ${checklist}${promptPath}`
      : `Execute the following plan: ${checklist}${promptPath}`;

    await coderAgent.generate(prompt);

    return {
      repoState: `Executed changes (iteration ${iteration}). Diff ready for Review.`,
      containsCoreFiles: false,
      iteration,
      checklist,
      projectPath,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 3: REVIEW — Judge A (Correctness only, synchronous)
// Judge B runs async post-mortem (see §6 in design.md)
// ═══════════════════════════════════════════════════════════

const reviewStep = createStep({
  id: 'reviewStep',
  inputSchema: codeOutputSchema,
  outputSchema: reviewOutputSchema,
  execute: async ({ inputData }) => {
    if (inputData?.containsCoreFiles) {
      return {
        status: 'SECURITY_HALT' as const,
        feedback: 'Security circuit breaker tripped. Manual intervention required.',
        iteration: inputData.iteration,
        checklist: inputData.checklist,
        projectPath: inputData.projectPath,
      };
    }

    const res = await reviewerAgent.generate(
      `[Judge A — Correctness Review]\nIteration: ${inputData.iteration}\nChanges: ${inputData.repoState}\n\nValidate syntax, logic, and structural correctness. If good, say APPROVE. If not, say REJECT: <reason>.`
    );

    let status: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'SECURITY_HALT' = 'APPROVE';
    if (res.text.includes('REJECT')) status = 'REJECT';
    if (res.text.includes('ESCALATE')) status = 'ESCALATE';

    return {
      status,
      feedback: res.text,
      iteration: inputData.iteration,
      checklist: inputData.checklist,
      projectPath: inputData.projectPath,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 4: ESCALATION — warn_admins after max failed iterations
// ═══════════════════════════════════════════════════════════

const escalateStep = createStep({
  id: 'escalateStep',
  inputSchema: reviewOutputSchema,
  outputSchema: z.object({
    status: z.literal('ESCALATED'),
    reason: z.string(),
    iterations: z.number(),
  }),
  execute: async ({ inputData }) => {
    console.error(`\n🚨 MAINTAINER WORKFLOW ESCALATION — Failed after ${inputData?.iteration || 3} iterations`);
    console.error(`Last feedback: ${inputData?.feedback || 'N/A'}\n`);

    return {
      status: 'ESCALATED' as const,
      reason: inputData?.feedback || 'Max iterations reached without approval',
      iterations: inputData?.iteration || 3,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 5: FINALIZE — Post-approval actions
// ═══════════════════════════════════════════════════════════

const finalizeStep = createStep({
  id: 'finalizeStep',
  inputSchema: reviewOutputSchema,
  outputSchema: z.object({
    status: z.string(),
    summary: z.string(),
    recipeId: z.number().optional(),
  }),
  execute: async ({ inputData }) => {
    let recipeId: number | undefined;

    try {
      console.log(`[Finalize] Distilling success for ${inputData?.projectPath || 'unknown project'}...`);
      
      const res = await distillerAgent.generate(
        `Distill this successful task into a Golden Action Recipe:\n` +
        `Feature Request: ${inputData?.checklist || 'N/A'}\n` +
        `Feedback approved: ${inputData?.feedback || 'N/A'}\n` +
        `Project: ${inputData?.projectPath || 'unknown'}`
      );

      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(inputData?.checklist || '').digest('hex');

      const engramRepo = getEngramRepository();
      const saveResult = await engramRepo.save({
        title: `Recipe: ${inputData?.checklist.substring(0, 50)}...`,
        content: res.text,
        type: 'recipe',
        project: inputData?.projectPath,
        topic_key: `recipe/${inputData?.projectPath || 'general'}/${hash}`
      });
      recipeId = saveResult.id;

      console.log(`[Finalize] Golden Action Recipe saved with ID: ${recipeId}`);
    } catch (e) {
      console.warn(`[Finalize] Distillation failed (non-blocking):`, e);
    }

    return {
      status: 'COMPLETED',
      summary: `Maintainer workflow completed after ${inputData?.iteration || 1} iteration(s). Changes approved and distilled.`,
      recipeId,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// SUB-WORKFLOW: Code → Review loop (used by dountil)
// ═══════════════════════════════════════════════════════════

const MAX_ITERATIONS = 3;

const codeReviewLoop = createWorkflow({
  id: 'code-review-loop',
  inputSchema: z.object({
    checklist: z.string(),
    containsCoreFiles: z.boolean(),
    featureRequest: z.string().optional(),
    feedback: z.string().optional(),
    iteration: z.number().optional(),
    projectPath: z.string().optional(),
  }),
  outputSchema: reviewOutputSchema,
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
    projectPath: z.string().optional(),
  }),
  outputSchema: z.any(),
})
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
