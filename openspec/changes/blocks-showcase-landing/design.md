# Design: Blocks Showcase Landing (Meta-Seed UI)

## Technical Approach

Promote `@delusion/blocks` from 3 placeholder pairs to 7 real typed blocks. Switch the theme system from per-key hex CSS var injection to a single DaisyUI named theme applied via `data-theme`. Rewrite `seed-landing/index.json` with neutral DaisyUI showcase content. All work is confined to `packages/` and `seeds/`.

## Architecture Decisions

### Decision: Theme system

| Option | Tradeoff | Decision |
|---|---|---|
| Keep `{key: hexColor}` + CSS var injection | Already wired; full granularity | ❌ Rejected — not DaisyUI v5 idiomatic; requires crafting oklch per-value; brittle |
| `{ theme: "retro" }` + `data-theme` on `<html>` | One value = full rebrand; idiomatic | ✅ Chosen |

`Layout.astro` reads `themeEntry.data.theme` → applies `data-theme={theme}` on `<html>`. The old CSS var injection block is removed entirely.

### Decision: DaisyUI v5 plugin activation

DaisyUI v5 requires explicit theme declaration in `global.css`. Without it, `data-theme` silently falls back to default light:

```css
@plugin "daisyui" {
  themes: retro --default, light;
}
```

### Decision: MenuSection → delete, not rename

`MenuSection` is domain-specific (restaurant). Replaced by `FeaturesSection` which has a different prop shape. Deleting both files and creating new ones is cleaner than a rename-with-rewrite. `BlockRenderer` and `index.ts` updated in lock-step.

### Decision: ContactSection → lead-capture form

Drops `address`, `phone`, `email` fields. New props: `nameLabel`, `emailLabel`, `messageLabel`, `submitLabel`, `action`. Static HTML form with `action="#"` default. No JS, no backend coupling.

### Decision: themeCollection schema

Tighten from `z.record(z.string())` to `z.object({ theme: z.string() })`. Astro regenerates `.astro/types.d.ts` on first build — no manual step needed.

## Data Flow

```
daisy.json { "theme": "retro" }
  └─→ Layout.astro (getEntry "theme" "daisy")
        └─→ <html data-theme="retro" class="scroll-smooth">
              └─→ DaisyUI CSS vars resolved by browser
                    └─→ All blocks: bg-primary, btn-primary, etc. → correct colors

index.json [{ type, props }, ...]
  └─→ [...slug].astro (getCollection "pages")
        └─→ blocks.map(block => <BlockRenderer type props />)
              └─→ BlockRenderer: blockMap[type] → Component
                    └─→ <Component {...props} />
```

## File Changes

| File | Action | Description |
|---|---|---|
| `packages/blocks/src/components/NavBar.types.ts` | Create | NavBarProps + NavBarLink interfaces |
| `packages/blocks/src/components/NavBar.astro` | Create | Sticky navbar with drawer mobile menu |
| `packages/blocks/src/components/HeroSection.types.ts` | Modify | Add kicker, secondaryCtaLabel/Href, image, align |
| `packages/blocks/src/components/HeroSection.astro` | Modify | Add badge, secondary CTA, optional two-column with image |
| `packages/blocks/src/components/FeaturesSection.types.ts` | Create | FeaturesSectionProps + Feature interfaces |
| `packages/blocks/src/components/FeaturesSection.astro` | Create | Responsive card grid |
| `packages/blocks/src/components/CarouselSection.types.ts` | Create | CarouselSectionProps + CarouselSlide interfaces |
| `packages/blocks/src/components/CarouselSection.astro` | Create | DaisyUI carousel with card slides |
| `packages/blocks/src/components/CTASection.types.ts` | Create | CTASectionProps with variant field |
| `packages/blocks/src/components/CTASection.astro` | Create | Full-width CTA band, primary/neutral variants |
| `packages/blocks/src/components/StatsSection.types.ts` | Create | StatsSectionProps + Stat interfaces |
| `packages/blocks/src/components/StatsSection.astro` | Create | Horizontal stats row, vertical on mobile |
| `packages/blocks/src/components/ContactSection.types.ts` | Modify | Replace address/phone/email with form field labels + action |
| `packages/blocks/src/components/ContactSection.astro` | Modify | Rewrite as lead-capture form |
| `packages/blocks/src/components/MenuSection.types.ts` | Delete | Restaurant domain — removed |
| `packages/blocks/src/components/MenuSection.astro` | Delete | Restaurant domain — removed |
| `packages/blocks/src/index.ts` | Modify | Export all new prop types, remove MenuSectionProps/MenuItem |
| `seeds/seed-landing/src/styles/global.css` | Modify | Add `themes: retro --default, light;` to daisyui plugin |
| `seeds/seed-landing/src/layouts/Layout.astro` | Modify | data-theme from daisy.json, scroll-smooth, remove CSS var injection |
| `seeds/seed-landing/src/content.config.ts` | Modify | Tighten themeCollection to `z.object({ theme: z.string() })` |
| `seeds/seed-landing/src/content/theme/daisy.json` | Modify | `{ "theme": "retro" }` |
| `seeds/seed-landing/src/content/pages/index.json` | Rewrite | 7-block showcase: NavBar→Hero→Features→Carousel→Stats→CTA→Contact |
| `seeds/seed-landing/src/content/config/delusion.json` | Modify | language → "en", site_name → "Delusion" |
| `seeds/seed-landing/src/components/BlockRenderer.astro` | Modify | Replace MenuSection with all 7 blocks |
| `blocks-manifest.json` | Modify | Remove MenuSection, add 5 new blocks, update Hero+Contact props |

**Totals**: 12 create, 11 modify, 2 delete.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Type check | All prop interfaces compile | `bunx tsc --noEmit` in `packages/blocks` |
| Visual — blocks | Each block renders correctly | `bun dev` in `seeds/seed-landing`, inspect each section |
| Visual — theme | All blocks respond to theme change | Swap `daisy.json` to `"corporate"` → rebuild → verify colors change |
| Visual — responsive | NavBar collapses on mobile | Resize browser to mobile width, verify drawer appears |

## Migration / Rollout

No data migration. No deploy pipeline in scope. `seed-landing` is a static template — rebuilt on demand. Rollback: `git revert` the change commit.

## Open Questions

- [ ] Should `NavBar` include a logo image slot in addition to `brand` text? (Proposal says text logo — keep simple for v1)
- [ ] `blocks-manifest.json` currently has no auto-sync. A follow-up change `blocks-manifest-sync` should generate it from `index.ts` exports. Flag for after this change.
