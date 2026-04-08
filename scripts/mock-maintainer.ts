/**
 * E2E Validation: Test Webhook to Maintainer Workflow (Phase 4.2)
 * Simulates an existing client triggering the Maintainer Agency for a custom feature.
 */

async function main() {
  const MASTRA_API_URL = process.env.MASTRA_API_URL || 'http://localhost:4111';

  const mockPayload = {
    messages: [
      {
        role: 'user',
        content: `Existing tenant "customer-99" has a new feature request: "Please add a massive bright pink banner to the top of my site that says 'HOLIDAY SALE!'. This needs to be a completely custom banner component injected into index.astro because the current blocks do not support pink text banners." Please orchestrate the Maintainer workflow to implement this.`,
      },
    ],
  };

  console.log('🚀 Triggering Orchestrator to route to Maintainer (Phase 4.2 E2E Test)...');
  try {
    const response = await fetch(`${MASTRA_API_URL}/api/agents/orchestrator/generate`, {
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
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Connection error:', error);
    console.log('Ensure the Mastra daemon is running on port 4111 (bun run dev).');
  }
}

main();
