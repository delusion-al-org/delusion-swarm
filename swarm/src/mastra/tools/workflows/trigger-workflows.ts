import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { forgeWorkflow } from '../../workflows/forge';
import { maintainerWorkflow } from '../../workflows/maintainer';

/**
 * Trigger Forge Workflow Tool
 * ───────────────────────────
 * Wraps the forgeWorkflow as a callable tool so the
 * Orchestrator agent can invoke it deterministically.
 *
 * This bridges the Agent ↔ Workflow gap in Mastra v1.22
 * where agents cannot natively delegate to workflows.
 */
export const triggerForge = createTool({
  id: 'trigger-forge',
  description:
    'Triggers the Forge Agency workflow to create a new tenant site. ' +
    'Pass the projectId (tenant identifier) and prompt (client requirements). ' +
    'Returns whether the site was created and if the Maintainer is needed for custom sections.',
  inputSchema: z.object({
    projectId: z.string().describe('Unique tenant identifier (e.g., "panaderia-paco")'),
    prompt: z.string().describe('Client requirements and preferences for site generation'),
  }),
  outputSchema: z.object({
    status: z.string(),
    requiresMaintainer: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      console.log(`[TriggerForge] Starting forge-agency for ${context.projectId}...`);

      const run = forgeWorkflow.createRun();
      const result = await run.start({
        inputData: {
          projectId: context.projectId,
          prompt: context.prompt,
        },
      });

      if (result.status === 'success') {
        return {
          status: 'success',
          requiresMaintainer: result.result?.requiresMaintainer ?? false,
        };
      }

      return {
        status: 'failed',
        requiresMaintainer: false,
        error: `Workflow ended with status: ${result.status}`,
      };
    } catch (error: any) {
      console.error('[TriggerForge] Workflow execution error:', error);
      return {
        status: 'error',
        requiresMaintainer: false,
        error: error.message || 'Unknown error in forge workflow',
      };
    }
  },
});

/**
 * Trigger Maintainer Workflow Tool
 * ─────────────────────────────────
 * Wraps the maintainerWorkflow as a callable tool.
 * The Orchestrator calls this for feature requests on existing tenants.
 */
export const triggerMaintainer = createTool({
  id: 'trigger-maintainer',
  description:
    'Triggers the Maintainer Agency workflow for an existing tenant. ' +
    'Handles feature requests, bug fixes, and design changes via Planner → Coder → Reviewer pipeline. ' +
    'The workflow has built-in safety with max 3 iterations and ESCALATION on core file access.',
  inputSchema: z.object({
    featureRequest: z.string().describe('Description of what needs to be changed or added'),
  }),
  outputSchema: z.object({
    status: z.string(),
    summary: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      console.log(`[TriggerMaintainer] Starting maintainer-agency...`);

      const run = maintainerWorkflow.createRun();
      const result = await run.start({
        inputData: {
          featureRequest: context.featureRequest,
        },
      });

      if (result.status === 'success') {
        return {
          status: 'success',
          summary: result.result?.summary || 'Maintainer workflow completed',
        };
      }

      return {
        status: result.status,
        summary: result.result?.reason || result.result?.summary,
        error: `Workflow ended with status: ${result.status}`,
      };
    } catch (error: any) {
      console.error('[TriggerMaintainer] Workflow execution error:', error);
      return {
        status: 'error',
        error: error.message || 'Unknown error in maintainer workflow',
      };
    }
  },
});
