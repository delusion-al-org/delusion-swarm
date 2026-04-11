import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { config } from 'dotenv';
import { join } from 'path';

// Load keys
config({ path: join(process.cwd(), 'swarm', '.env') });

async function test() {
  const rawKeys = process.env.NVIDIA_API_KEY || '';
  const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
  
  console.log(`📡 Detected ${keys.length} keys for NVIDIA.`);
  
  for (let i = 0; i < keys.length; i++) {
    console.log(`\n🔄 Testing Key ${i + 1}/${keys.length}...`);
    
    const nvidia = createOpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: keys[i],
    });

    try {
      const { text } = await generateText({
        model: nvidia('google/gemma-4-31b-it'),
        prompt: 'Say: "NVIDIA Key ' + (i + 1) + ' is WORKING and I am thinking."',
      });

      console.log('✅ Response:', text);
    } catch (error: any) {
      console.error(`❌ Key ${i + 1} failed:`, error.message);
    }
  }
}

test();
