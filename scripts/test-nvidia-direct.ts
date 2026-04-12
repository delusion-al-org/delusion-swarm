import { orchestrator } from '../swarm/src/mastra/agents/orchestrator';

async function main() {
  console.log('🚀 TESTING NVIDIA KEYS VIA generateLegacy()...');
  console.log('Using Keys: ' + (process.env.NVIDIA_API_KEY ? 'Present' : 'MISSING'));
  
  try {
    // Using generateLegacy() which is compatible with AI SDK v4 models
    // @ts-ignore
    const result = await orchestrator.generateLegacy(
       'Say "NVIDIA CONNECTION SUCCESS" if you can read this.'
    );

    console.log('\n✅ Response from NVIDIA:');
    console.log('---');
    console.log(result.text);
    console.log('---');
    
  } catch (error: any) {
    console.error('❌ Execution failed:', error.message);
  }
}

main();
