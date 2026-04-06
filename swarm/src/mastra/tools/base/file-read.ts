import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'fs/promises';

export const fileRead = createTool({
  id: 'file-read',
  description: 'Read the contents of a file at the given path',
  inputSchema: z.object({
    path: z.string().describe('Absolute path to the file'),
  }),
  outputSchema: z.object({
    content: z.string(),
    exists: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      const content = await readFile(context.path, 'utf-8');
      return { content, exists: true };
    } catch {
      return { content: '', exists: false, error: `File not found: ${context.path}` };
    }
  },
});
