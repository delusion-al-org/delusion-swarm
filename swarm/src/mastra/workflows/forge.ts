import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { forgeAgent } from '../agents/forge';
import { hydrateProject } from '../tools/fs/tenant-hydrator';
import { searchBlocks } from '../tools/blocks';
import { ejectToGithub } from '../tools/git/eject-github';

// Step 1: The AI generates the configuration natively
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
  execute: async ({ context }) => {
    // We execute the Forge agent to ONLY think about the configuration structure.
    // It has the searchBlocks tool to know what components exist.
    const res = await forgeAgent.generate(
      `Tenant ID: ${context.projectId}\nUser Request: ${context.prompt}\nGenerate the delusion.json config obeying the schema.`
    );
    
    // Attempt to extract the JSON from the LLM output
    let parsedConfig;
    try {
      // Very naive extraction, assumes structured output or pure JSON
      const text = res.text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      parsedConfig = JSON.parse(text);
    } catch (e) {
      console.warn('Forge agent did not return pure JSON. Falling back to default or escalating.', e);
      throw new Error('LLM failed to output parseable JSON config');
    }

    return { config: parsedConfig, projectId: context.projectId };
  },
});

// Step 2: Deterministic hydration logic (No LLM hallucinations here)
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
    requiresMaintainer: z.boolean(),
  }),
  execute: async ({ context }) => {
    console.log(`[ForgeWorkflow] Hydrating workspace for ${context.projectId}`);
    
    // Check if Forge spawned any custom_sections
    const hasCustomSections = Array.isArray(context.config?.custom_sections) && context.config.custom_sections.length > 0;
    
    // We call the logic of the tool deterministically
    const result = await hydrateProject.execute({ 
      context: { 
        projectId: context.projectId,
        config: context.config 
      }
    });

    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return { 
      status: 'success', 
      path: result.path || '',
      requiresMaintainer: hasCustomSections
    };
  },
});

// Step 3: GitOps Deployment (Zero-Cost Github Pages Ejection)
const ejectToGithubStep = createStep({
  id: 'ejectToGithub',
  description: 'Pushes the locally hydrated workspace to a new isolated repository under delusion-al-org',
  inputSchema: z.object({
    projectId: z.string(),
    path: z.string(),
    requiresMaintainer: z.boolean(),
  }),
  outputSchema: z.object({
    status: z.string(),
    requiresMaintainer: z.boolean(),
  }),
  execute: async ({ context }) => {
    console.log(`[ForgeWorkflow] Ejecting ${context.projectId} to GitHub...`);
    
    const result = await ejectToGithub.execute({
      context: {
        projectId: context.projectId,
        targetDir: context.path,
      }
    });

    if (result.status === 'error') {
      console.warn('[ForgeWorkflow] Non-fatal workflow warning: Github Ejection failed. Workspace generated locally only.', result.message);
    }

    return {
      status: result.status,
      // Pass the maintainer chain downstream so Orchestrator can capture it still!
      requiresMaintainer: context.requiresMaintainer, 
    };
  }
});

export const forgeWorkflow = createWorkflow({
  name: 'forge-agency',
  stepGraph: {
    initial: generateConfigStep,
  },
})
  .step(generateConfigStep)
  .then(hydrateWorkspaceStep)
  .then(ejectToGithubStep)
  .commit();
