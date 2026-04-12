/**
 * E2E Validation: Test Webhook to Orchestrator (Phase 4.1)
 * Simulates the Supabase Edge Function POSTing to Mastra's Orchestrator
 */

async function main() {
  const MASTRA_API_URL = process.env.MASTRA_API_URL || 'http://localhost:4112';

  const mockPayload = {
    agentId: 'orchestrator',
    messages: [
      {
        role: 'user',
        content: `New client registered: Test-Tenant-Alpha (test-tenant-01). Industry: restaurant. Requirements: Build a highly visual landing page with a hero, a menu, and a vibrant green dark mode theme. Please orchestrate the Forge Agent to build their site.`,
      },
    ],
  };

  console.log('🚀 Triggering Orchestrator asynchronously (Queue) for Phase 4.1 E2E Test...');
  try {
    const response = await fetch(`${MASTRA_API_URL}/async/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });

    if (!response.ok) {
      console.error(`❌ Request failed with status ${response.status}`);
      console.error(await response.text());
      return;
    }

    const data = await response.json();
    console.log('✅ Orchestrator Execution Success!');
    
    // Format the thought process and output to a file instead of raw terminal dump
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'scripts', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `orchestrator-webhook-${timestamp}.log`);
    
    let logContent = `============= WEBHOOK EXECUTION LOG =============\n`;
    logContent += `TIMESTAMP: ${new Date().toISOString()}\n`;
    logContent += `ENDPOINT: ${MASTRA_API_URL}/api/agents/orchestrator/generate\n`;
    logContent += `=================================================\n\n`;
    
    logContent += `--- ORCHESTRATOR THOUGHT PROCESS & RESPONSE ---\n`;
    if (data.text) logContent += `${data.text}\n\n`;
    if (data.steps) logContent += `STEPS TAKEN: ${JSON.stringify(data.steps, null, 2)}\n\n`;
    
    logContent += `--- RAW DATA DUMP ---\n`;
    logContent += JSON.stringify(data, null, 2);
    
    fs.writeFileSync(logFile, logContent);
    console.log(`📄 Detailed thought process and logs written to: ${logFile}`);
    console.log(`Summary Response: ${data.text ? data.text.substring(0, 200) + '...' : 'No text response'}`);

  } catch (error) {
    console.error('❌ Connection error:', error);
    console.log('Ensure the Mastra daemon is running on port 4111 (bun run dev).');
  }
}

main();
