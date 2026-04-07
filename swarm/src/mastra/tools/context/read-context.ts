import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * read_context tool — Reads the .delusion/context.md from a project repo.
 *
 * This is how agents understand the current state of a client's project:
 * its gotchas, preferences, last changes, and peculiarities.
 * Every agent should call this BEFORE making any changes.
 */
export const readContext = createTool({
  id: 'read-context',
  description:
    'Read the .delusion/context.md file from a project repository. ' +
    'Contains project state, client preferences, gotchas, and last changes. ' +
    'ALWAYS call this before working on an existing project.',
  inputSchema: z.object({
    projectPath: z
      .string()
      .describe('Absolute path to the project repository root'),
  }),
  outputSchema: z.object({
    content: z.string(),
    exists: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    const contextPath = join(context.projectPath, '.delusion', 'context.md');

    try {
      const content = await readFile(contextPath, 'utf-8');
      return { content, exists: true };
    } catch {
      return {
        content: '',
        exists: false,
        error: `No .delusion/context.md found at ${contextPath}. This may be a new project.`,
      };
    }
  },
});
