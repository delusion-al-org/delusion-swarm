/**
 * Demo entry point — validates the full agent chain works.
 * Run: bun src/index.ts
 */
import { mastra } from './mastra';

async function main() {
  console.log('\n🧪 Running delegation demo...\n');

  const orchestratorAgent = mastra.getAgent('orchestrator');

  const result = await orchestratorAgent.generate(
    'Please delegate this to the echo agent: "Hello from delusion-swarm! The factory daemon is alive."',
  );

  console.log('📨 Orchestrator response:');
  console.log(result.text);
  console.log('\n✅ Demo complete.');
}

main().catch(console.error);
