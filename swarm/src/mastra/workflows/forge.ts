import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { forgeAgent } from '../agents/forge';
import { hydrateProject } from '../tools/fs/tenant-hydrator';
import { ejectToGithub } from '../tools/git/eject-github';
import { registerProject } from '../tools/supabase/register-project';
import { searchBlocks } from '../tools/blocks';

// ═══════════════════════════════════════════════════════════
// STEP 1: AI cognition — Forge generates delusion.json
// ═══════════════════════════════════════════════════════════

const generateConfigStep = createStep({
  id: 'generateConfig',
  description: 'Uses the Forge agent to generate a delusion.json config',
  inputSchema: z.object({
    projectId: z.string(),
    prompt: z.string(),
  }),
  outputSchema: z.object({
    config: z.any().describe('The delusion.json schema output'),
    projectId: z.string(),
  }),
  execute: async ({ inputData }) => {
    // IMP-02: Pre-fetch available blocks deterministically so the LLM
    // has full context about what UI components exist. This prevents
    // the Forge from hallucinating block names.
    let blocksContext = '';
    try {
      const blocks = await searchBlocks.execute({
        query: inputData.prompt, limit: 20
      });
      if (blocks.blocks && blocks.blocks.length > 0) {
        blocksContext = `\n\nAvailable @delusion/blocks (use these exact names in sections[].block):\n${JSON.stringify(blocks.blocks, null, 2)}`;
      }
    } catch (e) {
      console.warn('[ForgeWorkflow] Could not pre-fetch blocks:', e);
    }

    const res = await forgeAgent.generate(
      `Tenant ID: ${inputData.projectId}\nUser Request: ${inputData.prompt}${blocksContext}\n\nGenerate the delusion.json config obeying the schema. Output ONLY valid JSON, no markdown fences.`
    );

    let parsedConfig;
    try {
      const text = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedConfig = JSON.parse(text);
    } catch (e) {
      console.warn('Forge agent did not return pure JSON. Falling back to default or escalating.', e);
      throw new Error('LLM failed to output parseable JSON config');
    }

    return { config: parsedConfig, projectId: inputData.projectId };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 2: Deterministic hydration (No LLM, pure filesystem)
// ═══════════════════════════════════════════════════════════

const hydrateWorkspaceStep = createStep({
  id: 'hydrateWorkspace',
  description: 'Physically creates the workspace and injects the JSON',
  inputSchema: z.object({
    config: z.any(),
    projectId: z.string(),
  }),
  outputSchema: z.object({
    status: z.string(),
    path: z.string(),
    projectId: z.string(),
    requiresMaintainer: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log(`[ForgeWorkflow] Hydrating workspace for ${inputData.projectId}`);

    // Check if Forge spawned any custom_sections
    const hasCustomSections =
      Array.isArray(inputData.config?.custom_sections) &&
      inputData.config.custom_sections.length > 0;

    // Call the hydrator tool deterministically
    const result = await hydrateProject.execute({
      projectId: inputData.projectId,
      config: inputData.config,
    });

    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return {
      status: 'success',
      path: result.path || '',
      projectId: inputData.projectId,
      requiresMaintainer: hasCustomSections,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// STEP 3: GitOps ejection (Zero-cost GitHub Pages deploy)
// ═══════════════════════════════════════════════════════════

const ejectToGithubStep = createStep({
  id: 'ejectToGithub',
  description: 'Pushes the locally hydrated workspace to a new isolated repository under delusion-al-org',
  inputSchema: z.object({
    status: z.string(),
    path: z.string(),
    projectId: z.string(),
    requiresMaintainer: z.boolean(),
  }),
  outputSchema: z.object({
    status: z.string(),
    requiresMaintainer: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log(`[ForgeWorkflow] Ejecting ${inputData.projectId} to GitHub...`);

    const result = await ejectToGithub.execute({
      projectId: inputData.projectId,
      targetDir: inputData.path,
    });

    if (result.status === 'error') {
      console.warn(
        '[ForgeWorkflow] Non-fatal: GitHub ejection failed. Workspace generated locally only.',
        result.message,
      );
    }

    try {
      // IMP-05: Deterministically register the project in Supabase
      await registerProject.execute({
        client_name: inputData.projectId,
        repo_url: `https://github.com/delusion-al-org/${inputData.projectId}`,
        seed_type: 'landing', // could be extracted from config
        status: 'active',
        current_version: '1.0.0'
      });
      console.log(`[ForgeWorkflow] Project ${inputData.projectId} registered in Supabase`);
    } catch (e) {
      console.warn('[ForgeWorkflow] Failed to register project in Supabase:', e);
    }

    return {
      status: result.status,
      requiresMaintainer: inputData.requiresMaintainer,
    };
  },
});

// ═══════════════════════════════════════════════════════════
// WORKFLOW: Cognition → Hydration → GitOps Ejection
// ═══════════════════════════════════════════════════════════

export const forgeWorkflow = createWorkflow({
  id: 'forge-agency',
  inputSchema: z.object({
    projectId: z.string(),
    prompt: z.string(),
  }),
  outputSchema: z.object({
    status: z.string(),
    requiresMaintainer: z.boolean(),
  }),
})
  .then(generateConfigStep)
  .then(hydrateWorkspaceStep)
  .then(ejectToGithubStep)
  .commit();
