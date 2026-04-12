---
status: proposed
created: 2026-04-11
updated: 2026-04-11
change: blocks-showcase-landing
---

# Change Proposal: Blocks Showcase Landing (Meta-Seed UI)

## 1. Intent and Value

**What are we trying to achieve?**
Implement the UI layer of the `seed-landing` meta-seed. This means promoting `@delusion/blocks` from three placeholder components to a real, typed, reusable block set, and wiring `seed-landing` so it renders a complete landing page using only those blocks driven by JSON content.

**Key framing: the meta-seed is a MOLD, not a brand.**
The meta-seed "landing" is a generic, reusable mold for any landing page archetype: SEO-focused, no login, no dynamic backend, with lead capture. It must render beautifully out of the box with zero brand identity — think "Lorem Ipsum Premium." The showcase content we ship uses DaisyUI demo copy so downstream consumers (the Forge agent, or a human cloning the seed) can immediately see what each block looks like and then swap props to rebrand.

What we export is the mold (blocks + renderer + JSON schema). What we ship for this change is neutral DaisyUI showcase content that demonstrates the mold.

**Why is this valuable?**
- Unblocks the Forge agent: today `blocks-manifest.json` references `MenuSection` (a restaurant menu) which is useless for a generic landing. With `FeaturesSection`, `StatsSection`, `CTASection`, `CarouselSection`, and `NavBar`, the Forge agent can compose a real marketing page from a prompt.
- Fixes a live bug: `seeds/seed-landing/src/content/pages/index.json` sends `primaryButtonText`/`imageUrl` to `HeroSection` which expects `ctaLabel`/`ctaHref`. The page is currently rendering with undefined props.
- Establishes the theme contract: switch from per-key hex injection (brittle) to a pre-built DaisyUI named theme via `data-theme`. Rebrand = one JSON value.
- Sets the template for future meta-seeds (`seed-ecommerce`, `seed-blog`, etc.) to follow the same `Block.types.ts + Block.astro + BlockRenderer + index.json + daisy.json` pattern.

## 2. Scope

**In scope — `packages/blocks/`:**
- Refactor `src/components/HeroSection.astro` + `HeroSection.types.ts`
- Delete `src/components/MenuSection.astro` + `MenuSection.types.ts` (breaking — see section 6)
- Refactor `src/components/ContactSection.astro` + `ContactSection.types.ts` → lead-capture form
- Create `src/components/NavBar.astro` + `NavBar.types.ts`
- Create `src/components/FeaturesSection.astro` + `FeaturesSection.types.ts`
- Create `src/components/CarouselSection.astro` + `CarouselSection.types.ts`
- Create `src/components/CTASection.astro` + `CTASection.types.ts`
- Create `src/components/StatsSection.astro` + `StatsSection.types.ts`
- Update `src/index.ts`: re-export all new prop types, drop `MenuSectionProps`/`MenuItem`

**In scope — `seeds/seed-landing/`:**
- Update `src/components/BlockRenderer.astro`: replace MenuSection with all 7 blocks
- Update `src/styles/global.css`: configure DaisyUI plugin with explicit themes
- Rewrite `src/content/pages/index.json`: neutral DaisyUI showcase content for all 7 blocks
- Rewrite `src/content/theme/daisy.json`: `{ "theme": "retro" }` 
- Update `src/layouts/Layout.astro`: apply `data-theme` from daisy.json, add `scroll-smooth`
- Update `src/content.config.ts`: tighten `themeCollection` to `z.object({ theme: z.string() })`
- Minor: `src/content/config/delusion.json` → flip `language` to `"en"` for the showcase

**In scope — repo root:**
- Update `blocks-manifest.json`: remove `MenuSection`, add entries for all new blocks, update `HeroSection` props

**Out of scope (explicit):**
- `swarm/**` — belongs to another developer, untouched
- Animations / scroll reveals
- i18n / language switching
- Dark mode runtime toggle
- Form submission backend (ContactSection is a static form)
- New meta-seeds (`seed-ecommerce`, etc.)
- Image optimization / Astro Image component
- Full accessibility audit

## 3. Theme Approach Decision

**Decision: pre-built DaisyUI named theme via `data-theme` attribute.**

| Option | Pros | Cons |
|---|---|---|
| A. Keep `{key: hexValue}` + inject `--color-{key}` CSS vars | Already implemented | Not idiomatic DaisyUI v5; brittle; user must pick 9 hex values; no automatic dark variants |
| B. `{ "theme": "retro" }` + `data-theme={theme}` | One JSON value = full rebrand; idiomatic DaisyUI v5; 30+ pre-built themes | Less granular (no partial overrides) |

**We choose Option B.** Rebrand = change one value in `daisy.json`. Done.

**Default for this change: `retro`** — strong visual identity that visibly proves the theme mechanism is working, yet neutral enough not to suggest a brand.

**DaisyUI v5 activation** requires updating `global.css`:
```css
@plugin "daisyui" {
  themes: retro --default, light;
}
```

## 4. Block API Decisions

All blocks follow the existing convention: `{Name}.types.ts` exports `{Name}Props`, `{Name}.astro` destructures from `Astro.props`. Only DaisyUI semantic classes — no raw Tailwind colors.

### 4.1 `NavBar`
```ts
export interface NavBarLink {
  label: string;
  href: string;
}
export interface NavBarProps {
  brand: string;
  links: NavBarLink[];
  ctaLabel?: string;
  ctaHref?: string;
  sticky?: boolean;        // default true
}
```
DaisyUI: `navbar`, `navbar-start/center/end`, `menu menu-horizontal`, `btn btn-primary`, `drawer` for mobile.

### 4.2 `HeroSection` (refactor)
```ts
export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  image?: string;
  align?: 'center' | 'start';    // default 'center'
}
```
DaisyUI: `hero min-h-[80vh] bg-base-200`, `hero-content`, `badge badge-primary`, `btn btn-primary btn-lg`, `btn btn-outline btn-lg`.

### 4.3 `FeaturesSection` (replaces MenuSection)
```ts
export interface Feature {
  title: string;
  description: string;
  icon?: string;           // emoji for now — no icon library dependency
}
export interface FeaturesSectionProps {
  title: string;
  subtitle?: string;
  features: Feature[];     // 3–6 items
  columns?: 2 | 3 | 4;    // default 3
}
```
DaisyUI: `grid`, `md:grid-cols-{n}`, `card bg-base-200`, `card-body`, `card-title`.

### 4.4 `CarouselSection`
```ts
export interface CarouselSlide {
  title: string;
  description?: string;
  image: string;
}
export interface CarouselSectionProps {
  title?: string;
  slides: CarouselSlide[];    // 3–8
}
```
DaisyUI: `carousel w-full`, `carousel-item w-full`, `card` inside each slide.

### 4.5 `CTASection`
```ts
export interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  variant?: 'primary' | 'neutral';    // default 'primary'
}
```
DaisyUI: `hero` variant, `bg-primary text-primary-content` or `bg-neutral text-neutral-content`, `btn btn-outline`.

### 4.6 `StatsSection`
```ts
export interface Stat {
  label: string;
  value: string;           // string so "99.9%" or "10k+" works
  description?: string;
}
export interface StatsSectionProps {
  title?: string;
  stats: Stat[];           // 3–4
}
```
DaisyUI: `stats stats-vertical lg:stats-horizontal shadow`, `stat`, `stat-title`, `stat-value`, `stat-desc`.

### 4.7 `ContactSection` (refactor)
```ts
export interface ContactSectionProps {
  title: string;
  subtitle?: string;
  nameLabel?: string;      // default "Name"
  emailLabel?: string;     // default "Email"
  messageLabel?: string;   // default "Message"
  submitLabel?: string;    // default "Send"
  action?: string;         // form POST target; default "#"
}
```
DaisyUI: `fieldset`, `input input-bordered`, `textarea textarea-bordered`, `btn btn-primary`. Drops old `address`/`phone`/`email` fields — this is a lead capture form.

## 5. Content Strategy

`index.json` block order:
1. **NavBar** — brand "Delusion", links Features/Showcase/Stats/Contact, CTA "Get Started" → `#contact`
2. **HeroSection** — kicker "Meta-Seed v0", title about beautiful landing pages from blocks, primary + secondary CTA, Unsplash image
3. **FeaturesSection** — 6 feature cards: "Typed Blocks", "DaisyUI Themed", "JSON-Driven", "SEO Ready", "Zero Brand Lock-in", "Forge-Compatible"
4. **CarouselSection** — 4 slides showing DaisyUI component families, Unsplash placeholders
5. **StatsSection** — 4 stats: "7 Blocks", "1 JSON config", "30+ Themes", "0ms runtime"
6. **CTASection** — "Ready to try the mold?" with Clone + Docs buttons
7. **ContactSection** — "Drop us a line" lead capture form

All copy in English, all images from Unsplash, zero brand references.

`delusion.json` → `language: "en"` to match the showcase content for SEO.

## 6. Breaking Changes

1. **`MenuSection` removed** — any `index.json` referencing `type: "MenuSection"` will show the "Block not registered" error. We own the only consumer (`seed-landing/index.json`), safe.
2. **`HeroSectionProps` API changes** — `index.json` was already broken (`primaryButtonText`/`imageUrl`), so we're fixing the bug, not introducing one.
3. **`ContactSectionProps` drops `address`/`phone`/`email`** — replaced with form fields. Only consumer is `seed-landing/index.json`.
4. **`daisy.json` schema changes** from `{ [key]: hexColor }` to `{ theme: string }` — tightened in lock-step.
5. **`blocks-manifest.json` updated** — Forge agent reads it dynamically, so it picks up new blocks at runtime without swarm code changes.
6. **`Layout.astro` stops injecting `--color-{key}` CSS vars** — no current consumers.

## 7. Rollback Plan

All changes are confined to files introduced/modified in this change, with no migrations or deploys.

1. `git revert` the merge commit → entire state reverts atomically.
2. If only the theme approach is problematic: revert only `Layout.astro` + `daisy.json` + `global.css`, keeping the new blocks intact. Blocks use semantic DaisyUI classes and render fine with any theme.
3. No database, no build cache, no CDN invalidation — Astro static output regenerates on next build.

## 8. Risks and Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| DaisyUI v5 theme activation requires explicit `themes:` in plugin config | 🔴 HIGH | global.css change is part of this proposal; verify in local preview |
| `swarm/**` may have hardcoded `MenuSection` references in Forge prompts | 🟡 MEDIUM | Flag to swarm developer; Forge `search-blocks` reads manifest dynamically so runtime is consistent |
| `themeCollection` schema tightening requires Astro type regeneration | 🟢 LOW | First build after change regenerates `.astro/types.d.ts` automatically |
| `blocks-manifest.json` drift risk (hand-maintained) | 🟢 LOW | Updated in lock-step in this change; `blocks-manifest-sync` follow-up change recommended |

**Open questions (resolved in spec/design):**
- DaisyUI theme choice: `retro` proposed. Alternatives: `corporate` (more neutral), `nord` (tech-y). ✅ Retro chosen.
- `scroll-smooth` on `<html>`: yes, add it to `Layout.astro`. ✅
- `language` flip to `en`: yes, for SEO coherence with showcase content. ✅
