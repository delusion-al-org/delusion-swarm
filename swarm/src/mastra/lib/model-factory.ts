import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { ollama } from 'ollama-ai-provider';

/**
 * Model Factory — Centralized LLM Provider Logic
 * ─────────────────────────────────────────────
 * Breaks circular dependencies and handles provider instantiation.
 */

export type Tier = 'free' | 'mid' | 'boost' | 'premium';

// Multi-key state for NVIDIA rotation
let nvidiaKeyIndex = 0;

function createModelInstance(provider: string, model: string): any {
  switch (provider) {
    case 'nvidia': {
      const keys = (process.env.NVIDIA_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
      if (keys.length === 0) return null;

      const selectedKey = keys[nvidiaKeyIndex % keys.length];
      nvidiaKeyIndex++;

      const nvidiaClient = createOpenAI({
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: selectedKey,
        compatibility: 'compatible',
      });

      return nvidiaClient.chat(model);
    }

    case 'openrouter': {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return null;
      return createOpenRouter({ apiKey: key })(model);
    }

    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return null;
      return createAnthropic({ apiKey: key })(model);
    }

    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return null;
      return createOpenAI({ apiKey: key })(model);
    }

    case 'ollama': {
      return ollama(model);
    }

    default:
      return null;
  }
}

export function getModelChain(agentRole: string, tier: Tier = 'free'): any {
  const envVar = `${agentRole.toUpperCase()}_MODELS`;
  const modelsConfig = process.env[envVar] || process.env.ORCHESTRATOR_MODELS;
  
  if (modelsConfig) {
    const chains = modelsConfig.split(',').map((c) => c.trim());
    for (const entry of chains) {
      const slashIndex = entry.indexOf('/');
      if (slashIndex === -1) continue;

      const provider = entry.substring(0, slashIndex);
      const model = entry.substring(slashIndex + 1);
      const instance = createModelInstance(provider, model);
      if (instance) return instance;
    }
  }

  // Fallback to defaults if no env config works
  const fallbackModel = tier === 'free' ? 'meta/llama-3.1-70b-instruct' : 'gpt-4o';
  const fallbackProvider = tier === 'free' ? 'nvidia' : 'openai';
  
  return createModelInstance(fallbackProvider, fallbackModel) || openai(fallbackModel);
}
