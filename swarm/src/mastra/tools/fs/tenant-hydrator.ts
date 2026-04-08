import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { delusionConfigSchema } from '../../schemas/delusion-config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const hydrateProject = createTool({
  id: 'hydrate-project',
  name: 'Hydrate Project',
  description: 'Copies the seed-landing meta-seed into a new workspace and injects the delusion.json config',
  inputSchema: z.object({
    projectId: z.string().describe('The unique tenant identifier (e.g., "customer-123")'),
    config: delusionConfigSchema.describe('The generated delusion configuration JSON payload'),
  }),
  execute: async ({ context }) => {
    const { projectId, config } = context;
    try {
      const rootDir = process.env.AGENT_WORKSPACE || path.resolve(process.cwd(), '../../workspaces');
      const targetDir = path.resolve(rootDir, projectId);
      const seedDir = path.resolve(process.cwd(), '../seeds/seed-landing');

      // 1. Ensure absolute containment
      if (!targetDir.startsWith(rootDir)) {
        throw new Error('Security Error: Target directory escapes AGENT_WORKSPACE');
      }

      // 2. Clone the meta-seed ONLY if it doesn't exist
      try {
        await fs.stat(targetDir);
        console.log(`[Hydrator] Tenant ${projectId} already exists. Skipping seed clone to protect custom code.`);
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          await fs.cp(seedDir, targetDir, { recursive: true });
        } else {
          throw e; // Reraise if it's a permission error, etc.
        }
      }

      // 3. Ensure content/business directory exists
      const contentDir = path.join(targetDir, 'src/content/business');
      await fs.mkdir(contentDir, { recursive: true });

      // 4. Inject delusion.json
      const jsonPath = path.join(contentDir, 'delusion.json');
      await fs.writeFile(jsonPath, JSON.stringify(config, null, 2), 'utf-8');

      // 5. Update package.json name to match tenant
      const pkgPath = path.join(targetDir, 'package.json');
      try {
        const pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        pkgData.name = `@delusion-tenant/${projectId}`;
        await fs.writeFile(pkgPath, JSON.stringify(pkgData, null, 2), 'utf-8');
      } catch (e) {
        console.warn(`Could not update package.json for ${projectId}`, e);
      }

      // 6. Optional: Trigger a fast install if bun is available (can be disconnected for pure speed)
      // await execAsync('bun install', { cwd: targetDir });

      return {
        status: 'success',
        message: `Project hydrated successfully at ${targetDir}`,
        path: targetDir,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to hydrate project: ${error.message}`,
      };
    }
  },
});
