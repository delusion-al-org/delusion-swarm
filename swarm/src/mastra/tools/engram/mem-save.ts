import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const memSave = createTool({
  id: 'engram_mem_save',
  description: 'Saves a Golden Action Recipe, discovered pattern, or structural abstraction into the global Engram brain for cross-project reuse.',
  inputSchema: z.object({
    title: z.string(),
    content: z.string().describe('Structured content formatted as **What**, **Why**, **Where**, **Learned**'),
    type: z.enum(['architecture', 'decision', 'pattern', 'recipe', 'bugfix']),
    project: z.string().optional(),
    topic_key: z.string().optional(),
  }),
  execute: async (context) => {
    // TODO: Connect this to the Engram SQLite DB or the MCP Client bridge
    console.log(`[Engram Save] ${context.type.toUpperCase()}: ${context.title}`);
    return {
      success: true,
      message: 'Engram memory saved successfully (Stub).',
    };
  },
});
