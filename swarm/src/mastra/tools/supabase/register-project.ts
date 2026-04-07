import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '../../supabase/client';

export const registerProject = createTool({
  id: 'register-project',
  description:
    'Register a new project in the Supabase central registry. ' +
    'The Forge Agent calls this AFTER successfully generating a new site.',
  inputSchema: z.object({
    client_name: z.string().describe('Client or business name'),
    repo_url: z.string().describe('GitHub repository URL'),
    seed_type: z.string().describe('Type of seed used (e.g., restaurant, bakery)'),
    status: z.enum(['active', 'pending', 'archived']).default('active'),
    current_version: z.string().default('1.0.0'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_name: context.client_name,
          repo_url: context.repo_url,
          seed_type: context.seed_type,
          status: context.status,
          current_version: context.current_version,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
