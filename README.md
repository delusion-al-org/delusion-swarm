# delusion-swarm

Autonomous web factory — an AI agent swarm that discovers local businesses without websites, generates premium sites for them, and deploys at zero cost.

## Architecture

```
ORCHESTRATOR (plans + coordinates)
├── SCOUT     → discovers leads (OSM, Google Maps, enrichment)
├── FORGE     → generates sites from seed templates (DaisyUI + Astro)
├── DEPLOYER  → pushes to GitHub Pages ($0 hosting)
└── MAINTAINER → handles change requests and iterations
```

Built with [Mastra](https://mastra.ai) (TypeScript agent framework), provider-agnostic LLM support, and a tiered model system that runs **free by default**.

## Quick Start

```bash
# Install dependencies
bun install

# Copy env file and configure your keys
cp env.example .env

# Start the dev server
bun dev

# Or run the demo
bun src/index.ts
```

## Docker

```bash
# Local
docker compose up

# Coolify / VPS
# Point Coolify to this repo — it auto-detects the Dockerfile
```

## LLM Provider Strategy

| Tier | Models | Cost |
|------|--------|------|
| `free` | OpenRouter free models, Ollama local | $0 |
| `mid` | Llama 3.3, Gemma 2 via OpenRouter/Groq | ~$0 |
| `boost` | Claude Sonnet, GPT-4o | ~$0.01/req |
| `premium` | Claude Opus | ~$0.05/req |

Each agent has its own model priority chain. Configure via env vars:

```env
ORCHESTRATOR_MODELS=openrouter/google/gemma-2-27b-it:free,ollama/gemma2:9b
FORGE_MODELS=openrouter/anthropic/claude-sonnet,ollama/gemma2:9b
```

## Project Structure

```
src/
  index.ts                      # Demo entry point
  mastra/
    index.ts                    # Mastra instance + server config
    agents/
      orchestrator.ts           # Supervisor agent (delegates to sub-agents)
      echo.ts                   # Test stub agent
    providers/
      registry.ts               # Tier-based model resolution + fallback chains
    tools/
      base/                     # Shared tools: file I/O, bash, git
    workflows/                  # Future: deterministic pipelines
openspec/                       # SDD planning artifacts
```

## Status

**Phase**: Foundation (factory-daemon-core)

- [x] Project scaffold (bun + Mastra + TypeScript)
- [x] Provider registry with model chains
- [x] Base tools (file read/write/edit, bash, git)
- [x] Orchestrator + echo agent
- [x] Docker + docker-compose
- [ ] Scout agent (lead discovery)
- [ ] Forge agent (site generation)
- [ ] Deployer agent (GitHub Pages CI)
- [ ] Seed templates (DaisyUI + Astro)
- [ ] Admin panel

## Team

Built by [delusion-al](https://github.com/delusion-al-org) — Diego & Miguel.
