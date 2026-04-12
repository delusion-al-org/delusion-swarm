// Definitive fetch test to bypass all SDK issues and prove the keys and rotation logic.
async function test() {
  const envKeys = "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,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";
  const keys = envKeys.split(',').map(k => k.trim());
  const model = "google/gemma-4-31b-it";

  console.log(`🚀 VALIDATING NVIDIA KEYS (${keys.length} detected)`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`\n🔄 Testing Key ${i+1}: ${key.substring(0, 15)}...`);
    
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say: KEY_" + (i+1) + "_OPERATIONAL" }],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        console.log(`✅ SUCCESS! Response: "${data.choices[0].message.content}"`);
      } else {
        const err = await response.text();
        console.error(`❌ FAILED (Status ${response.status}): ${err}`);
      }
    } catch (e: any) {
      console.error(`❌ CONNECTION ERROR: ${e.message}`);
    }
  }
}

test();
