const rawKeys = process.env.NVIDIA_API_KEY || '';
const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

async function test() {
  console.log(`📡 Detected ${keys.length} keys for NVIDIA.`);
  
  for (let i = 0; i < keys.length; i++) {
    console.log(`\n🔄 Testing Key ${i + 1}/${keys.length}...`);
    
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys[i]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [{ role: 'user', content: 'Say: NVIDIA Key ' + (i + 1) + ' is WORKING.' }],
          max_tokens: 20
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Response:', data.choices[0].message.content);
      } else {
        console.error(`❌ API Error for Key ${i + 1}:`, JSON.stringify(data));
      }
    } catch (error: any) {
      console.error(`❌ Connection failed:`, error.message);
    }
  }
}

test();
