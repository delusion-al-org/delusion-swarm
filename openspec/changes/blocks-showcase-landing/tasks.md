# Tasks: Blocks Showcase Landing (Meta-Seed UI)

## Phase 1: Foundation — Types & Cleanup

- [ ] 1.1 Delete `packages/blocks/src/components/MenuSection.astro` and `MenuSection.types.ts`
- [ ] 1.2 Update `packages/blocks/src/components/HeroSection.types.ts` — add `kicker?`, `secondaryCtaLabel?`, `secondaryCtaHref?`, `image?`, `align?: 'center' | 'start'`
- [ ] 1.3 Rewrite `packages/blocks/src/components/ContactSection.types.ts` — replace address/phone/email with `nameLabel?`, `emailLabel?`, `messageLabel?`, `submitLabel?`, `action?`
- [ ] 1.4 Create `packages/blocks/src/components/NavBar.types.ts` — `NavBarLink` + `NavBarProps` (brand, links, ctaLabel?, ctaHref?, sticky?)
- [ ] 1.5 Create `packages/blocks/src/components/FeaturesSection.types.ts` — `Feature` + `FeaturesSectionProps` (title, subtitle?, features[], columns?)
- [ ] 1.6 Create `packages/blocks/src/components/CarouselSection.types.ts` — `CarouselSlide` + `CarouselSectionProps` (title?, slides[])
- [ ] 1.7 Create `packages/blocks/src/components/CTASection.types.ts` — `CTASectionProps` (title, subtitle?, ctaLabel, ctaHref, secondaryCtaLabel?, secondaryCtaHref?, variant?)
- [ ] 1.8 Create `packages/blocks/src/components/StatsSection.types.ts` — `Stat` + `StatsSectionProps` (title?, stats[])
- [ ] 1.9 Update `packages/blocks/src/index.ts` — export all new prop types, remove `MenuSectionProps` and `MenuItem`

## Phase 2: Block Components

- [ ] 2.1 Rewrite `packages/blocks/src/components/HeroSection.astro` — add kicker badge (`badge badge-primary`), optional image two-column layout, secondary CTA (`btn btn-outline btn-lg`)
- [ ] 2.2 Rewrite `packages/blocks/src/components/ContactSection.astro` — lead-capture form with `input input-bordered`, `textarea textarea-bordered`, `btn btn-primary`; use `fieldset` wrapper
- [ ] 2.3 Create `packages/blocks/src/components/NavBar.astro` — sticky `navbar bg-base-100`, `menu menu-horizontal` (hidden on mobile), `drawer` hamburger for mobile, optional CTA btn
- [ ] 2.4 Create `packages/blocks/src/components/FeaturesSection.astro` — `grid md:grid-cols-{columns}` of `card bg-base-200` with icon emoji, `card-title`, `card-body`
- [ ] 2.5 Create `packages/blocks/src/components/CarouselSection.astro` — `carousel w-full`, each slide is `carousel-item w-full` wrapping a `card`
- [ ] 2.6 Create `packages/blocks/src/components/CTASection.astro` — `hero` variant, `bg-primary text-primary-content` or `bg-neutral text-neutral-content` per `variant` prop
- [ ] 2.7 Create `packages/blocks/src/components/StatsSection.astro` — `stats stats-vertical lg:stats-horizontal shadow`, one `stat` per item with `stat-title`, `stat-value`, `stat-desc`

## Phase 3: Seed Landing Wiring & Content

- [ ] 3.1 Update `seeds/seed-landing/src/styles/global.css` — change `@plugin "daisyui"` to `@plugin "daisyui" { themes: retro --default, light; }`
- [ ] 3.2 Rewrite `seeds/seed-landing/src/layouts/Layout.astro` — read `themeEntry.data.theme`, apply `data-theme={theme}` and `class="scroll-smooth"` on `<html>`, remove `--color-{key}` CSS var injection block
- [ ] 3.3 Update `seeds/seed-landing/src/content.config.ts` — change `themeCollection` schema from `z.record(z.string())` to `z.object({ theme: z.string() })`
- [ ] 3.4 Rewrite `seeds/seed-landing/src/content/theme/daisy.json` — `{ "theme": "retro" }`
- [ ] 3.5 Update `seeds/seed-landing/src/content/config/delusion.json` — set `language: "en"`, `site_name: "Delusion"`
- [ ] 3.6 Update `seeds/seed-landing/src/components/BlockRenderer.astro` — add imports for NavBar, FeaturesSection, CarouselSection, CTASection, StatsSection; remove MenuSection; update blockMap
- [ ] 3.7 Rewrite `seeds/seed-landing/src/content/pages/index.json` — 7 blocks in order: NavBar → HeroSection → FeaturesSection → CarouselSection → StatsSection → CTASection → ContactSection; all props matching updated interfaces; English showcase copy; Unsplash image URLs
- [ ] 3.8 Update `blocks-manifest.json` — remove MenuSection entry; add NavBar, FeaturesSection, CarouselSection, CTASection, StatsSection; update HeroSection and ContactSection prop schemas

## Phase 4: Verification

- [ ] 4.1 Run `cd packages/blocks && bunx tsc --noEmit` — zero type errors required
- [ ] 4.2 Run `cd seeds/seed-landing && bun dev` — inspect all 7 blocks render correctly in browser
- [ ] 4.3 Theme test: change `daisy.json` to `{ "theme": "corporate" }`, rebuild, verify ALL block colors update — then restore `retro`
- [ ] 4.4 Responsive test: open browser devtools mobile view, verify NavBar shows hamburger drawer and hides horizontal menu
