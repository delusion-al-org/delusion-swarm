import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getEngramRepository } from '../../adapters/engram';

/**
 * Engram Search Tool
 * ─────────────────────────────────────────────────────────
 * Domain tool — talks ONLY to IEngramRepository (the port).
 * Zero knowledge of SQLite, HTTP, or any concrete adapter.
 */
export const memSearch = createTool({
  id: 'engram_mem_search',
  description:
    'Searches the global Engram brain for Golden Action Recipes, previous architecture patterns, ' +
    'and shared cross-project knowledge. Returns matching observations ranked by relevance.',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    project: z.string().optional().describe('Filter by project name'),
    type: z.string().optional().describe('Filter by observation type: recipe, pattern, bugfix, decision, architecture'),
    limit: z.coerce.number().int().positive().max(20).optional().default(10).describe('Max results'),
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    count: z.number(),
    mode: z.string(),
    message: z.string(),
  }),
  execute: async (context) => {
    const repo = getEngramRepository();
    const results = await repo.search({
      query: context.query,
      project: context.project,
      type: context.type,
      limit: context.limit,
    });

    const mode = process.env.ENGRAM_MODE || 'stub';
    return {
      results,
      count: results.length,
      mode,
      message: results.length > 0
        ? `Found ${results.length} matching observations.`
        : `No results found. Mode: ${mode}.`,
    };
  },
});
