import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export const fileWrite = createTool({
  id: 'file-write',
  description: 'Write content to a file, creating parent directories if needed',
  inputSchema: z.object({
    path: z.string().describe('Absolute path to write'),
    content: z.string().describe('File content to write'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      await mkdir(dirname(context.path), { recursive: true });
      await writeFile(context.path, context.content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
