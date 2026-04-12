import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getEngramRepository } from '../../adapters/engram';

/**
 * Engram Save Tool
 * ─────────────────────────────────────────────────────────
 * Domain tool — talks ONLY to IEngramRepository (the port).
 * Zero knowledge of SQLite, HTTP, or any concrete adapter.
 */
export const memSave = createTool({
  id: 'engram_mem_save',
  description:
    'Saves a Golden Action Recipe, discovered pattern, or structural abstraction into the global ' +
    'Engram brain for cross-project reuse. Use the structured content format.',
  inputSchema: z.object({
    title: z.string().describe('Short, searchable title (e.g. "Dark mode toggle recipe")'),
    content: z.string().describe('Structured content: **What**, **Why**, **Where**, **Learned**'),
    type: z.enum(['architecture', 'decision', 'pattern', 'recipe', 'bugfix', 'discovery']),
    project: z.string().optional().describe('Project name for scoping'),
    topic_key: z.string().optional().describe('Stable key for upserts (e.g. "recipe/dark-mode-toggle")'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.number().optional(),
    mode: z.string(),
    message: z.string(),
  }),
  execute: async (context) => {
    const repo = getEngramRepository();
    const result = await repo.save({
      title: context.title,
      content: context.content,
      type: context.type,
      project: context.project,
      topic_key: context.topic_key,
    });

    const mode = process.env.ENGRAM_MODE || 'stub';
    return {
      success: result.success,
      id: result.id,
      mode,
      message: result.success
        ? `Observation "${context.title}" saved (mode: ${mode}).`
        : `Failed to save observation (mode: ${mode}).`,
    };
  },
});
