# Skill Registry — delusion-swarm

Generated: 2026-04-11
Project: delusion-al (delusion-swarm workspace)

## User Skills

| Skill | Trigger | Source |
|-------|---------|--------|
| go-testing | Go tests, teatest, test coverage | `~/.claude/skills/go-testing/SKILL.md` |
| skill-creator | Create new skill, add agent instructions | `~/.claude/skills/skill-creator/SKILL.md` |
| branch-pr | Creating PR, opening PR, preparing changes for review | `~/.claude/skills/branch-pr/SKILL.md` |
| issue-creation | Creating GitHub issue, reporting bug, requesting feature | `~/.claude/skills/issue-creation/SKILL.md` |
| judgment-day | "judgment day", "dual review", "juzgar", adversarial review | `~/.claude/skills/judgment-day/SKILL.md` |

## Project Skills

None detected.

## Project Conventions

| File | Source |
|------|--------|
| (none) | No project-level CLAUDE.md or agents.md |

## Compact Rules

### Astro + DaisyUI (applies to: packages/blocks/**/*.astro, seeds/**/*.astro)
- Block convention: `{Name}.types.ts` + `{Name}.astro` pairs in `packages/blocks/src/components/`
- Export types from `packages/blocks/src/index.ts`
- Register new blocks in `seeds/seed-landing/src/components/BlockRenderer.astro`
- Add block props to `seeds/seed-landing/src/content/pages/index.json`
- Use DaisyUI semantic classes only — NO raw Tailwind colors (bg-blue-500 → bg-primary)
- Theme vars injected via daisy.json → Layout.astro as `--color-{key}` CSS vars
- DaisyUI v5 uses oklch — theme values in daisy.json must be oklch strings

### TypeScript + Mastra (applies to: swarm/src/**/*.ts)
- Strict mode enabled, no unused locals/params
- Mastra v1 subpath imports: `@mastra/core/agent`, `@mastra/core/tools`, `@mastra/core/mastra`
- createTool execute signature: `async (context) =>` (direct input, NOT `{ context }`)
- Agent requires both `id` and `name` fields
- ESLint 9 flat config + typescript-eslint
- Vitest for testing, `passWithNoTests: true`

### Git + PR (applies to: git operations)
- Conventional commits only, NO Co-Authored-By or AI attribution
- Issue-first workflow: create issue before PR (branch-pr skill)
- Use `gh` CLI for GitHub operations
