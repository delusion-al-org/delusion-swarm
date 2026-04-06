import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
// Using any as ai-sdk-provider 3 removed LanguageModelV1
export type LanguageModelV1 = any;

export type Tier = 'free' | 'mid' | 'boost' | 'premium';

export class ProviderNotConfiguredError extends Error {
  constructor(tier: Tier, missingVar: string) {
    super(
      `Provider for tier "${tier}" is not configured. Missing env var: ${missingVar}. ` +
        `Set it in .env or pass it as an environment variable.`,
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

const TIER_DEFAULTS: Record<Tier, { provider: string; model: string; envVar: string }[]> = {
  free: [
    { provider: 'openrouter', model: 'google/gemma-2-27b-it:free', envVar: 'OPENROUTER_API_KEY' },
    { provider: 'ollama', model: 'gemma2:9b', envVar: 'OLLAMA_BASE_URL' },
  ],
  mid: [
    {
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct',
      envVar: 'OPENROUTER_API_KEY',
    },
    { provider: 'openrouter', model: 'google/gemma-2-27b-it:free', envVar: 'OPENROUTER_API_KEY' },
  ],
  boost: [
    { provider: 'anthropic', model: 'claude-sonnet-4-6', envVar: 'ANTHROPIC_API_KEY' },
    { provider: 'openai', model: 'gpt-4o', envVar: 'OPENAI_API_KEY' },
    {
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-4-6',
      envVar: 'OPENROUTER_API_KEY',
    },
  ],
  premium: [
    { provider: 'anthropic', model: 'claude-opus-4-6', envVar: 'ANTHROPIC_API_KEY' },
    { provider: 'openai', model: 'gpt-4o', envVar: 'OPENAI_API_KEY' },
  ],
};

function createModelInstance(
  provider: string,
  model: string,
): LanguageModelV1 | null {
  switch (provider) {
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
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      return createOpenAI({ baseURL: `${baseUrl}/v1`, apiKey: 'ollama' })(model);
    }
    default:
      return null;
  }
}

/**
 * Resolve the first available model for a given tier.
 * Tries each provider in order until one has valid credentials.
 */
export function getModel(tier: Tier): LanguageModelV1 {
  const candidates = TIER_DEFAULTS[tier];

  for (const candidate of candidates) {
    const model = createModelInstance(candidate.provider, candidate.model);
    if (model) return model;
  }

  const required = candidates[0];
  throw new ProviderNotConfiguredError(tier, required.envVar);
}

/**
 * Resolve the model chain for a specific agent.
 * Reads from <AGENT_NAME>_MODELS env var (comma-separated).
 * Falls back to the given default tier if no env var is set.
 */
export function getModelChain(agentName: string, defaultTier: Tier = 'free'): LanguageModelV1 {
  const envKey = `${agentName.toUpperCase()}_MODELS`;
  const envValue = process.env[envKey];

  if (envValue) {
    const entries = envValue.split(',').map((s) => s.trim());

    for (const entry of entries) {
      // Format: provider/model-id (e.g. openrouter/google/gemma-2-27b-it:free)
      const slashIndex = entry.indexOf('/');
      if (slashIndex === -1) continue;

      const provider = entry.substring(0, slashIndex);
      const model = entry.substring(slashIndex + 1);
      const instance = createModelInstance(provider, model);
      if (instance) return instance;
    }
  }

  return getModel(defaultTier);
}

/**
 * List which providers are configured (for health/debug endpoints).
 */
export function getConfiguredProviders(): Record<string, boolean> {
  return {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    ollama: true, // always "available" — may not be running
  };
}
