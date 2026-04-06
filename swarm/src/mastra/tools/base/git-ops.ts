import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { execSync } from 'child_process';

const ALLOWED_OPS = ['status', 'diff', 'log', 'add', 'commit', 'push', 'pull', 'clone', 'checkout', 'branch'] as const;

export const gitOps = createTool({
  id: 'git-ops',
  description: 'Execute git operations in a repository',
  inputSchema: z.object({
    operation: z.enum(ALLOWED_OPS).describe('Git operation to perform'),
    args: z.string().optional().describe('Additional arguments'),
    cwd: z.string().optional().describe('Working directory (defaults to process.cwd())'),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    exitCode: z.number(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    const cmd = context.args
      ? `git ${context.operation} ${context.args}`
      : `git ${context.operation}`;

    try {
      const stdout = execSync(cmd, {
        cwd: context.cwd ?? process.cwd(),
        encoding: 'utf-8',
        timeout: 30_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout, exitCode: 0 };
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; status?: number };
      return {
        stdout: e.stdout ?? '',
        exitCode: e.status ?? 1,
        error: e.stderr ?? String(err),
      };
    }
  },
});
