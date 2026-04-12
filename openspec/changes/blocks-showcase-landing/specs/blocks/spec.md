# Block Components Specification

## Purpose

Defines the contract for all block components in `@delusion/blocks`. Each block MUST be independently renderable, theme-agnostic, and driven exclusively by its typed props.

## Requirements

### Requirement: Prop Contract

Each block MUST expose a `{Name}Props` TypeScript interface in `{Name}.types.ts` and MUST destructure only those props from `Astro.props`. Required props MUST be typed as non-optional. Optional props MUST have documented fallback behavior.

#### Scenario: Required props present

- GIVEN a block is rendered with all required props
- WHEN the Astro component resolves
- THEN it MUST render without errors and display all required prop values

#### Scenario: Optional props absent

- GIVEN a block is rendered without optional props
- WHEN the Astro component resolves
- THEN it MUST render using its documented fallback values, not crash or display undefined

---

### Requirement: DaisyUI-only styling

Each block MUST use only DaisyUI semantic class names (`bg-primary`, `btn-primary`, `card`, etc.). Blocks MUST NOT use raw Tailwind color utilities (`bg-indigo-500`, `text-gray-800`).

#### Scenario: Theme switched

- GIVEN any block rendered on the page
- WHEN the `data-theme` attribute on `<html>` changes to a different DaisyUI theme
- THEN all block colors, backgrounds, and button variants MUST update to reflect the new theme without any prop or code changes

---

### Requirement: NavBar

The system MUST render a sticky top navigation bar with anchor links and an optional primary CTA button. On small viewports it MUST collapse links into a drawer-based menu.

#### Scenario: Anchor navigation

- GIVEN a NavBar with `links: [{ label: "Features", href: "#features" }]`
- WHEN the user clicks the link
- THEN the browser MUST scroll to the element with `id="features"` using smooth scroll

#### Scenario: Mobile drawer

- GIVEN a viewport narrower than `md` breakpoint
- WHEN the page loads
- THEN the horizontal link list MUST be hidden and a hamburger toggle MUST be visible

---

### Requirement: HeroSection

The system MUST render a full-height hero with a primary CTA. A `kicker` badge, `subtitle`, secondary CTA, and optional `image` are optional.

#### Scenario: Center-aligned hero without image

- GIVEN `align: "center"` and no `image` prop
- WHEN rendered
- THEN content MUST be horizontally centered and fill at least 80vh

#### Scenario: Hero with image

- GIVEN an `image` URL is provided
- WHEN rendered
- THEN a two-column layout MUST appear: text left, image right

---

### Requirement: FeaturesSection

The system MUST render a responsive grid of feature cards. Each card MUST display `title` and `description`. `icon` and `columns` are optional.

#### Scenario: Default grid

- GIVEN `features` array with 6 items and no `columns` prop
- WHEN rendered
- THEN cards MUST display in a 3-column grid on `md`+ breakpoints

---

### Requirement: CarouselSection

The system MUST render a horizontally scrollable carousel. Each slide MUST display an image and `title`. `description` is optional.

#### Scenario: Slide content

- GIVEN 4 slides
- WHEN rendered
- THEN all 4 slides MUST be present in the DOM and horizontally scrollable

---

### Requirement: CTASection

The system MUST render a full-width call-to-action band. `variant: "primary"` uses `bg-primary`; `variant: "neutral"` uses `bg-neutral`.

#### Scenario: Primary variant

- GIVEN `variant: "primary"`
- WHEN rendered
- THEN the section background MUST use `bg-primary` and text MUST use `text-primary-content`

---

### Requirement: StatsSection

The system MUST render a row of stat items. Each stat MUST display `label` and `value`. `description` is optional.

#### Scenario: Responsive layout

- GIVEN 4 stats
- WHEN rendered on `lg`+ breakpoint
- THEN stats MUST display horizontally; on smaller viewports they MUST stack vertically

---

### Requirement: ContactSection

The system MUST render a lead-capture form with name, email, and message fields. The form `action` MUST be configurable via props. Default `action` MUST be `"#"` (inert).

#### Scenario: Inert form default

- GIVEN no `action` prop
- WHEN the user submits the form
- THEN the page MUST NOT navigate away (action="#" behavior)
