import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile, writeFile } from 'fs/promises';

export const fileEdit = createTool({
  id: 'file-edit',
  description: 'Find and replace a string in a file',
  inputSchema: z.object({
    path: z.string().describe('Absolute path to the file'),
    oldStr: z.string().describe('String to find'),
    newStr: z.string().describe('Replacement string'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    replacements: z.number(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      const content = await readFile(context.path, 'utf-8');
      if (!content.includes(context.oldStr)) {
        return { success: false, replacements: 0, error: `String not found in ${context.path}` };
      }
      const updated = content.replaceAll(context.oldStr, context.newStr);
      const replacements = (content.split(context.oldStr).length - 1);
      await writeFile(context.path, updated, 'utf-8');
      return { success: true, replacements };
    } catch (err) {
      return { success: false, replacements: 0, error: String(err) };
    }
  },
});
