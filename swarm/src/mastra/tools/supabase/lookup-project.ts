import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '../../supabase/client';

export const lookupProject = createTool({
  id: 'lookup-project',
  description:
    'Lookup a project in Supabase by client name or repository URL. ' +
    'The Orchestrator calls this to determine if a project exists before delegating ' +
    'to the Forge (new project) or the Maintainer (existing project).',
  inputSchema: z.object({
    repo_url: z.string().optional().describe('GitHub repository URL (e.g. github.com/delusion-al-org/site-paco)'),
    client_name: z.string().optional().describe('Client or business name'),
  }),
  outputSchema: z.object({
    exists: z.boolean(),
    project: z
      .object({
        id: z.string(),
        client_name: z.string(),
        repo_url: z.string(),
        status: z.string(),
        current_version: z.string(),
        seed_type: z.string(),
      })
      .optional(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    if (!context.repo_url && !context.client_name) {
      return { exists: false, error: 'Must provide either repo_url or client_name' };
    }

    try {
      let query = supabase.from('projects').select('*');
      
      if (context.repo_url) {
        query = query.eq('repo_url', context.repo_url);
      } else if (context.client_name) {
        // Simple ilike match for names
        query = query.ilike('client_name', `%${context.client_name}%`);
      }

      const { data, error } = await query.limit(1).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return { exists: false };
        }
        return { exists: false, error: error.message };
      }

      return { exists: true, project: data };
    } catch (err) {
      return { exists: false, error: String(err) };
    }
  },
});
