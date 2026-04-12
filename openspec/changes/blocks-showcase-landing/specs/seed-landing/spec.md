# Seed Landing Assembly Specification

## Purpose

Defines the behavior of `seed-landing` as a meta-seed: how the JSON-driven content pipeline assembles pages, how the theme is loaded, and what the BlockRenderer contract is.

## Requirements

### Requirement: Theme configuration

The system MUST read a single `theme` string from `seeds/seed-landing/src/content/theme/daisy.json` and apply it as `data-theme="{theme}"` on the `<html>` element. The system MUST NOT inject individual CSS color variables from this file.

#### Scenario: Theme applied

- GIVEN `daisy.json` contains `{ "theme": "retro" }`
- WHEN any page renders
- THEN the `<html>` element MUST have `data-theme="retro"`

#### Scenario: Theme change

- GIVEN `daisy.json` is updated to `{ "theme": "corporate" }`
- WHEN the site is rebuilt
- THEN ALL blocks on ALL pages MUST reflect the `corporate` palette without any other changes

---

### Requirement: DaisyUI plugin activation

`seeds/seed-landing/src/styles/global.css` MUST configure the DaisyUI plugin with at least the default theme explicitly declared using the `--default` flag.

#### Scenario: Default theme active

- GIVEN `@plugin "daisyui" { themes: retro --default, light; }` in `global.css`
- WHEN the page loads without a `data-theme` override
- THEN the `retro` theme MUST be applied as the default visual style

---

### Requirement: BlockRenderer mapping

`BlockRenderer.astro` MUST maintain an explicit import map of all registered block types. Unregistered block types MUST render a visible error section, not silently fail.

#### Scenario: Registered block

- GIVEN `index.json` contains `{ "type": "HeroSection", "props": {...} }`
- WHEN the page renders
- THEN `HeroSection.astro` MUST be rendered with the provided props

#### Scenario: Unregistered block type

- GIVEN `index.json` contains `{ "type": "UnknownBlock", "props": {} }`
- WHEN the page renders
- THEN a visible error section MUST appear indicating the block type is not registered

---

### Requirement: JSON-driven page content

Pages MUST be defined in `seeds/seed-landing/src/content/pages/*.json`. The `blocks` array MUST drive all visible page content. Props in the JSON MUST exactly match the `{Name}Props` interface of the referenced block.

#### Scenario: Full landing page

- GIVEN `index.json` defines blocks: NavBar → HeroSection → FeaturesSection → CarouselSection → StatsSection → CTASection → ContactSection
- WHEN the root path `/` renders
- THEN all 7 blocks MUST appear in that order on the page

#### Scenario: Prop mismatch

- GIVEN a block `props` object contains keys not present in `{Name}Props`
- WHEN the page renders
- THEN extra props MUST be silently ignored (Astro behavior); missing required props MUST cause a TypeScript error at build time

---

### Requirement: SEO via config

The Layout MUST apply `<title>` and `<meta description>` from `config/delusion.json` via `astro-seo`. Each page MAY override the title via its JSON `title` field.

#### Scenario: Page title override

- GIVEN `index.json` has `"title": "Home"` and `delusion.json` has `"site_name": "Delusion"`
- WHEN the page renders
- THEN the `<title>` MUST be `"Home | Delusion"`

---

### Requirement: Smooth scroll

The `<html>` element MUST include the `scroll-smooth` class so anchor links (e.g. `href="#contact"`) scroll with animation natively.

#### Scenario: Anchor click

- GIVEN a NavBar link with `href="#contact"`
- WHEN the user clicks it
- THEN the viewport MUST animate-scroll to `id="contact"` without a page reload
