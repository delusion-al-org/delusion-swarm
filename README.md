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

## Monorepo Structure

This repo is a Bun workspace monorepo:

```
delusion-swarm/
├── swarm/                  # Mastra agent swarm (AI backend)
│   ├── src/
│   │   └── mastra/
│   │       ├── agents/     # Orchestrator, Scout, Forge, Deployer...
│   │       ├── providers/  # Tier-based LLM provider registry
│   │       └── tools/      # Shared tools: file I/O, bash, git
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── packages/
│   └── blocks/             # @delusion/blocks — shared Astro UI components
│       └── src/
│           └── components/ # HeroSection, MenuSection, ContactSection...
│
├── seeds/
│   └── restaurant/         # Reference seed — static Astro site (DaisyUI v5)
│
├── scripts/
│   └── publish-seed.ts     # Publishes a seed to its own standalone repo
│
└── openspec/               # SDD planning artifacts
```

## Quick Start

```bash
# Clone the repo
git clone git@github.com:delusion-al-org/delusion-swarm.git
cd delusion-swarm

# Install all workspace dependencies from the monorepo root
bun install

# --- Swarm (AI backend) ---
cd swarm
cp .env.example .env        # Fill in your API keys
bun run dev                 # Starts Mastra dev server on :4111

# --- Seed (Astro site preview) ---
cd seeds/restaurant
bun run dev                 # Starts Astro dev server on :4321
bun run build               # Builds static site to seeds/restaurant/dist/
```

## Docker

Build context is the **monorepo root**:

```bash
# From the repo root:
docker build -f swarm/Dockerfile -t delusion-swarm .

# Or via docker-compose (from swarm/):
cd swarm
docker compose up
```

## Publishing a Seed

The `publish-seed` script resolves `workspace:*` dependencies to pinned versions and pushes the seed to its own standalone repo:

```bash
# Dry run (no push — inspect the temp dir)
bun scripts/publish-seed.ts restaurant --dry-run

# Publish to git@github.com:delusion-al-org/seed-restaurant.git
bun scripts/publish-seed.ts restaurant

# Force push + tag
bun scripts/publish-seed.ts restaurant --force --tag 0.2.0
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

## Status

**Phase**: Monorepo + Seed System (seed-system)

- [x] Project scaffold (bun + Mastra + TypeScript)
- [x] Provider registry with model chains
- [x] Base tools (file read/write/edit, bash, git)
- [x] Orchestrator + echo agent
- [x] Docker + docker-compose
- [x] Bun monorepo restructure (swarm + packages + seeds)
- [x] `@delusion/blocks` — shared Astro UI components
- [x] `seeds/restaurant` — reference seed (DaisyUI v5 + Tailwind v4)
- [x] `publish-seed.ts` — seed publish pipeline
- [ ] Scout agent (lead discovery)
- [ ] Forge agent (site generation from seeds)
- [ ] Deployer agent (GitHub Pages CI)
- [ ] Admin panel

## Team

Built by [delusion-al](https://github.com/delusion-al-org) — Diego & Miguel.
