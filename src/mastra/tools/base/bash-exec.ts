import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { execSync } from 'child_process';

const DEFAULT_ALLOWLIST = ['git', 'bun', 'curl', 'cp', 'mv', 'mkdir', 'cat', 'ls', 'echo'];

function getAllowlist(): string[] {
  const envList = process.env.BASH_ALLOWLIST;
  if (envList) {
    return [...DEFAULT_ALLOWLIST, ...envList.split(',').map((s) => s.trim())];
  }
  return DEFAULT_ALLOWLIST;
}

function isCommandAllowed(command: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const binary = command.trim().split(/\s+/)[0];
  return getAllowlist().includes(binary);
}

export const bashExec = createTool({
  id: 'bash-exec',
  description: 'Execute a shell command. Restricted to allowlisted commands in production.',
  inputSchema: z.object({
    command: z.string().describe('Shell command to execute'),
    timeout: z.number().optional().describe('Timeout in ms (default: 30000)'),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    if (!isCommandAllowed(context.command)) {
      return {
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: `Command not permitted in production: "${context.command.split(/\s+/)[0]}"`,
      };
    }

    try {
      const stdout = execSync(context.command, {
        timeout: context.timeout ?? 30_000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; status?: number };
      return {
        stdout: e.stdout ?? '',
        stderr: e.stderr ?? '',
        exitCode: e.status ?? 1,
      };
    }
  },
});
