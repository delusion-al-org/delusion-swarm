import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase } from '../../supabase/client';

export const updateProject = createTool({
  id: 'update-project',
  description:
    'Update an existing project in the Supabase central registry. ' +
    'The Maintainer Agent calls this AFTER successfully completing an iteration to bump the version or update the status.',
  inputSchema: z.object({
    id: z.string().describe('Project UUID'),
    status: z.enum(['active', 'pending', 'archived']).optional(),
    current_version: z.string().optional().describe('New version (e.g., 1.1.0)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      const updates: Record<string, string> = {
        last_updated: new Date().toISOString(),
      };
      
      if (context.status) updates.status = context.status;
      if (context.current_version) updates.current_version = context.current_version;

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', context.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
