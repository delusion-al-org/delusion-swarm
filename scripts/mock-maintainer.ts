/**
 * E2E Validation: Test Webhook to Maintainer Workflow (Phase 4.2)
 * Simulates an existing client triggering the Maintainer Agency for a custom feature.
 */

async function main() {
  const MASTRA_API_URL = process.env.MASTRA_API_URL || 'http://localhost:4112';

  const mockPayload = {
    messages: [
      {
        role: 'user',
        content: `Existing tenant "customer-99" has a new feature request: "Please add a massive bright pink banner to the top of my site that says 'HOLIDAY SALE!'. This needs to be a completely custom banner component injected into index.astro because the current blocks do not support pink text banners." Please orchestrate the Maintainer workflow to implement this.`,
      },
    ],
  };

  console.log('🚀 Triggering Orchestrator asynchronously (Queue) to route to Maintainer (Phase 4.2 E2E Test)...');
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
    console.log('✅ Maintainer Workflow Invocation Success!');
    
    // Format the thought process and output to a file instead of raw terminal dump
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'scripts', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `maintainer-webhook-${timestamp}.log`);
    
    let logContent = `============= MAINTAINER WEBHOOK LOG =============\n`;
    logContent += `TIMESTAMP: ${new Date().toISOString()}\n`;
    logContent += `ENDPOINT: ${MASTRA_API_URL}/api/agents/orchestrator/generate\n`;
    logContent += `=================================================\n\n`;
    
    logContent += `--- MAINTAINER THOUGHT PROCESS & RESPONSE ---\n`;
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
