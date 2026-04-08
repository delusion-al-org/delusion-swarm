import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);

export const ejectToGithub = createTool({
  id: 'eject-to-github',
  name: 'Eject to GitHub',
  description: 'Creates a new remote repository in the delusion-al-org organization and pushes the hydrated tenant workspace to it.',
  inputSchema: z.object({
    projectId: z.string().describe('The unique tenant identifier (e.g., "customer-123")'),
    targetDir: z.string().describe('The absolute path to the locally hydrated workspace'),
  }),
  execute: async ({ context }) => {
    const { projectId, targetDir } = context;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GITHUB_TOKEN is missing. Cannot eject repo to GitHub.');
    }

    try {
      console.log(`[GitOps] Creating remote repository delusion-al-org/${projectId}...`);
      
      // 1. Create Repo in Github Org
      const createRepoRes = await fetch('https://api.github.com/orgs/delusion-al-org/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Delusion-Swarm-Node'
        },
        body: JSON.stringify({
          name: projectId,
          private: true,
          description: `Automatically hydrated workspace for tenant ${projectId}`,
        }),
      });

      if (!createRepoRes.ok) {
        const errorText = await createRepoRes.text();
        // Ignore "name already exists" if it's a re-hydration, but we should handle it
        if (!errorText.includes('name already exists')) {
          console.error('[GitOps] Repo creation failed:', errorText);
          throw new Error(`GitHub API error: ${errorText}`);
        }
        console.log(`[GitOps] Repo might already exist. Proceeding with push.`);
      }

      // 2. Initialize local git and push
      console.log(`[GitOps] Initializing local git at ${targetDir}...`);
      
      const remoteUrl = `https://x-access-token:${token}@github.com/delusion-al-org/${projectId}.git`;

      // We chain commands safely. We configure local git user to "delusion-al" as requested.
      const gitScript = `
        git init &&
        git config user.name "delusion-al" &&
        git config user.email "bot@delusion.al" &&
        git add . &&
        git commit -m "chore: initial tenant hydration" || true &&
        git branch -M main &&
        git remote remove origin || true &&
        git remote add origin "${remoteUrl}" &&
        git push -u origin main --force
      `;

      const { stdout, stderr } = await execAsync(gitScript, { cwd: targetDir });
      console.log('[GitOps] Push successful.', stdout);

      return {
        status: 'success',
        message: `Successfully ejected ${projectId} to GitHub at delusion-al-org/${projectId}`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to eject to GitHub: ${error.message}`,
      };
    }
  },
});
