/**
 * E2E Validation: Test Webhook to Orchestrator (Phase 4.1)
 * Simulates the Supabase Edge Function POSTing to Mastra's Orchestrator
 */

async function main() {
  const MASTRA_API_URL = process.env.MASTRA_API_URL || 'http://localhost:4111';

  const mockPayload = {
    messages: [
      {
        role: 'user',
        content: `New client registered: Test-Tenant-Alpha (test-tenant-01). Industry: restaurant. Requirements: Build a highly visual landing page with a hero, a menu, and a vibrant green dark mode theme. Please orchestrate the Forge Agent to build their site.`,
      },
    ],
  };

  console.log('🚀 Triggering Orchestrator for Phase 4.1 E2E Test...');
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
    console.log('✅ Orchestrator Execution Success!');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Connection error:', error);
    console.log('Ensure the Mastra daemon is running on port 4111 (bun run dev).');
  }
}

main();
