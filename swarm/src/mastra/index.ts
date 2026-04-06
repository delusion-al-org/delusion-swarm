import { Mastra } from '@mastra/core/mastra';
import type { Context } from 'hono';
import { orchestrator } from './agents/orchestrator';
import { getConfiguredProviders } from './providers/registry';

const startTime = Date.now();

export const mastra = new Mastra({
  agents: { orchestrator },
  server: {
    port: Number(process.env.PORT) || 4111,
    apiRoutes: [
      {
        path: '/health',
        method: 'GET',
        handler: async (c: Context) => {
          const providers = getConfiguredProviders();
          return c.json({
            status: 'ok',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            providers,
          });
        },
      },
    ],
  },
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
