import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const warnAdmins = createTool({
  id: 'warn_admins',
  description: 'Triggers an escalation to the human development team when the agent encounters an unsolvable problem, high uncertainty, or a massive architectural shift request.',
  inputSchema: z.object({
    projectId: z.string().uuid(),
    reason: z.string(),
    severity: z.enum(['warning', 'critical']),
    agentRole: z.string(),
  }),
  execute: async (context) => {
    // In the future this might post to a Slack Webhook, Discord channel, or a Supabase table 'admin_alerts'.
    // For now, we log it strictly and simulate the webhook pause.
    console.error(`\n==============================================\n`);
    console.error(`🚨 ADMIN ESCALATION TRIGGERED [${context.severity.toUpperCase()}]`);
    console.error(`Agent: ${context.agentRole}`);
    console.error(`Project: ${context.projectId}`);
    console.error(`Reason: ${context.reason}`);
    console.error(`\n==============================================\n`);
    
    return {
      success: true,
      status: 'escalated',
      message: 'The administrative team has been notified. The workflow must now stand by or gracefully exit.',
    };
  },
});
