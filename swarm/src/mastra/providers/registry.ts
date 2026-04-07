import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
// Using any as ai-sdk-provider 3 removed LanguageModelV1
export type LanguageModelV1 = any;

export type Tier = 'free' | 'mid' | 'boost' | 'premium';

/**
 * CostMode controls the global cost ceiling for the swarm.
 * - zero-cost: Everything runs on free tier (Ollama/OpenRouter free models)
 * - balanced:  Forge/Scout/Deployer use free, Maintainer uses boost
 * - quality:   All agents use boost/premium (for important clients)
 */
export type CostMode = 'zero-cost' | 'balanced' | 'quality';

/** Agent roles for tier clamping */
type AgentRole = 'orchestrator' | 'scout' | 'forge' | 'deployer' | 'maintainer' | string;

/** Maximum tier per agent role per cost mode */
const COST_MODE_CAPS: Record<CostMode, Record<string, Tier>> = {
  'zero-cost': {
    orchestrator: 'free',
    scout: 'free',
    forge: 'free',
    deployer: 'free',
    maintainer: 'free',
    _default: 'free',
  },
  balanced: {
    orchestrator: 'mid',
    scout: 'free',
    forge: 'mid',
    deployer: 'free',
    maintainer: 'boost',
    _default: 'mid',
  },
  quality: {
    orchestrator: 'boost',
    scout: 'mid',
    forge: 'boost',
    deployer: 'free',
    maintainer: 'premium',
    _default: 'boost',
  },
};

const TIER_ORDER: Tier[] = ['free', 'mid', 'boost', 'premium'];

/**
 * Get the current cost mode from environment.
 */
export function getCostMode(): CostMode {
  const mode = process.env.COST_MODE as CostMode | undefined;
  if (mode && ['zero-cost', 'balanced', 'quality'].includes(mode)) return mode;
  return 'zero-cost'; // Default: free operation
}

/**
 * Clamp a requested tier to the maximum allowed by the current cost mode.
 */
export function clampTier(requestedTier: Tier, agentRole: AgentRole): Tier {
  const mode = getCostMode();
  const caps = COST_MODE_CAPS[mode];
  const maxTier = caps[agentRole] ?? caps._default;

  const requestedIdx = TIER_ORDER.indexOf(requestedTier);
  const maxIdx = TIER_ORDER.indexOf(maxTier);

  return requestedIdx <= maxIdx ? requestedTier : maxTier;
}

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
  // Apply cost mode clamping to the default tier
  const clampedTier = clampTier(defaultTier, agentName as AgentRole);

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

  return getModel(clampedTier);
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
