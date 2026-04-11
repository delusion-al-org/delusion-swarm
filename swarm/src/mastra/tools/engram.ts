import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getEngramRepository } from '../adapters/engram';

export const engramSave = createTool({
  id: 'engram-save',
  description: 'Saves a structured observation, decision, or learning to the persistent Engram Brain.',
  inputSchema: z.object({
    title: z.string().describe('Short searchable title'),
    content: z.string().describe('Full documentation of what was learned or decided'),
    type: z.enum(['decision', 'bugfix', 'architecture', 'discovery', 'pattern', 'learning']).default('learning'),
    project: z.string().optional().describe('Project identifier (e.g. tenant-id)'),
    topic_key: z.string().optional().describe('Stable key to update same topic over time'),
  }),
  execute: async ({ input }) => {
    const repository = getEngramRepository();
    const result = await repository.save(input);
    return {
      status: result.success ? 'success' : 'error',
      observationId: result.id,
      message: result.success ? 'Observation saved to persistent memory.' : 'Failed to save to engram.',
    };
  },
});

export const engramSearch = createTool({
  id: 'engram-search',
  description: 'Searches the persistent Engram Brain for past context, decisions, or architectural patterns.',
  inputSchema: z.object({
    query: z.string().describe('Search terms or natural language question'),
    project: z.string().optional().describe('Filter by project identifier'),
    type: z.string().optional().describe('Filter by observation type'),
    limit: z.number().optional().default(5),
  }),
  execute: async ({ input }) => {
    const repository = getEngramRepository();
    const results = await repository.search(input);
    return {
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        type: r.type,
        updated_at: r.updated_at,
      })),
      count: results.length,
    };
  },
});
