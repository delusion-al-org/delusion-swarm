import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MASTRA_API_URL = Deno.env.get('MASTRA_API_URL') || 'http://host.docker.internal:4111';
const WEBHOOK_SECRET = Deno.env.get('MASTRA_WEBHOOK_SECRET');

// Type definition for Supabase Database Webhook payload
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  schema: string;
  old_record: any | null;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Optional: Verify Webhook Secret to prevent unauthorized invocations
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== \`Bearer \${WEBHOOK_SECRET}\`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const payload: WebhookPayload = await req.json();

    console.log(\`Received \${payload.type} event on table \${payload.table}\`);

    // Determine the action based on the tenant's new state
    let prompt = '';
    
    if (payload.table === 'tenants' && payload.type === 'INSERT') {
      const tenant = payload.record;
      prompt = \`New client registered: \${tenant.name} (\${tenant.id}). Industry: \${tenant.industry || 'unknown'}. Requirements: \${tenant.requirements || 'Build a standard landing page'}. Please orchestrate the Forge Agent to build their site.\`;
      
    } else if (payload.table === 'feature_requests' && payload.type === 'INSERT') {
      const request = payload.record;
      prompt = \`Tenant \${request.tenant_id} has a new feature request: \${request.description}. Please orchestrate the Maintainer workflow to implement this.\`;
    } else {
      return new Response(JSON.stringify({ status: 'ignored', message: 'Unhandled event type or table' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(\`Dispatching prompt to Orchestrator: \${prompt}\`);

    // Call Mastra's native agent generate endpoint in background (Fire-and-Forget)
    // We do NOT await this because Mastra LLM generation takes 20-40s and this endpoint timeouts.
    fetch(\`\${MASTRA_API_URL}/api/agents/orchestrator/generate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      }),
    }).catch(err => console.error('Failed to trigger Mastra background task:', err));

    return new Response(
      JSON.stringify({ status: 'accepted', message: 'Delegated to Orchestrator in background' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
