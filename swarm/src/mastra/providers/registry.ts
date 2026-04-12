/**
 * Provider Registry — DEPRECATED (Use lib/model-factory.ts)
 * ───────────────────────────────────────────────────────
 * Maintained for backward compatibility.
 */

export * from '../lib/model-factory';

export function getConfiguredProviders(): Record<string, boolean> {
  return {
    nvidia: !!process.env.NVIDIA_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    ollama: true,
  };
}
