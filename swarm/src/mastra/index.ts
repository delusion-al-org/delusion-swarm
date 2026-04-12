import * as fs from 'fs';
import * as path from 'path';
import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import type { Context } from 'hono';
import { orchestrator } from './agents/orchestrator';
import { forgeAgent } from './agents/forge';
import { plannerAgent } from './agents/planner';
import { coderAgent } from './agents/coder';
import { reviewerAgent } from './agents/reviewer';
import { maintainerWorkflow } from './workflows/maintainer';
import { forgeWorkflow } from './workflows/forge';
import { getConfiguredProviders } from './providers/registry';
import { getJobQueue } from './adapters/queue';

const startTime = Date.now();

export const mastra = new Mastra({
  agents: { orchestrator, forge: forgeAgent, planner: plannerAgent, coder: coderAgent, reviewer: reviewerAgent },
  workflows: { maintainerWorkflow, forgeWorkflow },
  server: {
    port: Number(process.env.PORT) || 4111,
    apiRoutes: [
      registerApiRoute('/health', {
        method: 'GET',
        handler: async (c: Context) => {
          const providers = getConfiguredProviders();
          return c.json({
            status: 'ok',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            providers,
          });
        },
      }),
      registerApiRoute('/async/dispatch', {
        method: 'POST',
        handler: async (c: Context) => {
          const body = await c.req.json();
          // Generate a custom jobId or use crypto UUID
          const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          const queue = getJobQueue();
          
          await queue.enqueue(jobId, {
            agentRole: 'orchestrator', // Always route through orchestrator to decide
            messages: body.messages || [],
            metadata: body.metadata || {},
          });
          
          // Fast Return to prevent 504 Gateway Timeouts
          return c.json({
            status: 'queued',
            jobId,
            message: 'Task received and queued asynchronously.'
          }, 202);
        },
      }),
    ],
  },
});

// Configure long-running worker queue immediately after Mastra boots
const queue = getJobQueue();
queue.initWorker(async (jobId, payload) => {
  console.log(`[Queue Runner] Invoking ${payload.agentRole} for Job: ${jobId}`);
  if (payload.agentRole === 'orchestrator') {
    let content = `=== ASYNC JOB LOG: ${jobId} ===\n`;
    try {
      // IMP: Extract the prompt from the messages array to avoid SDK errors
      const lastMessage = payload.messages[payload.messages.length - 1];
      const prompt = typeof lastMessage === 'string' ? lastMessage : lastMessage?.content || '';

      const result = await orchestrator.generate(prompt);
      if (result.text) content += `${result.text}\n\n`;
      if (result.steps) content += `STEPS TAKEN:\n${JSON.stringify(result.steps, null, 2)}\n\n`;
      content += `RAW DATA:\n${JSON.stringify(result, null, 2)}`;
    } catch (error: any) {
      content += `\n❌ ASYNC CATCH ERROR ❌\n${error.message}\n${error.stack}`;
      console.error(`[Queue Runner] Job ${jobId} threw error:`, error.message);
    }
    
    const logsDir = path.resolve(process.cwd(), '..', 'scripts', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFile = path.join(logsDir, `async-${jobId}.log`);
    fs.writeFileSync(logFile, content);
    console.log(`[Queue Runner] Written deep-thought logs to: ${logFile}`);
  }
});

// Log configured providers on startup
const providers = getConfiguredProviders();
const configured = Object.entries(providers)
  .filter(([, v]) => v)
  .map(([k]) => k);
const unconfigured = Object.entries(providers)
  .filter(([k, v]) => !v && k !== 'ollama')
  .map(([k]) => k);

console.log('🐝 delusion-swarm daemon starting...');
console.log(`   Port: ${process.env.PORT || 4111}`);
console.log(`   Providers configured: ${configured.join(', ') || 'none'}`);
if (unconfigured.length > 0) {
  console.log(`   Providers unconfigured: ${unconfigured.join(', ')}`);
}
