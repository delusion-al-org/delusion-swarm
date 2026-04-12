import { z } from 'zod';

/**
 * Schema for a single section in a delusion site.
 * Each section maps to a block from @delusion/blocks.
 */
export const sectionSchema = z.object({
  type: z.string().describe('Block component name (e.g. "HeroSection", "MenuSection")'),
  props: z.record(z.unknown()).describe('Props to pass to the block component'),
  order: z.number().optional().describe('Display order (lower = higher on page)'),
});

/**
 * Schema for theme configuration.
 * Maps to DaisyUI theme customization.
 */
export const themeSchema = z.object({
  preset: z
    .string()
    .default('light')
    .describe('DaisyUI theme preset (light, dark, cupcake, business, etc.)'),
  primary: z.string().optional().describe('Primary color override (HSL or hex)'),
  secondary: z.string().optional().describe('Secondary color override'),
  accent: z.string().optional().describe('Accent color override'),
  font: z.string().optional().describe('Google Fonts family name'),
});

/**
 * Schema for business metadata.
 * Information about the client's business.
 */
export const businessSchema = z.object({
  name: z.string().describe('Business name'),
  type: z
    .string()
    .describe('Business type/category (restaurant, bakery, salon, etc.)'),
  description: z.string().optional().describe('Short business description'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  hours: z.record(z.string()).optional().describe('Operating hours by day'),
  social: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

/**
 * Main delusion.json configuration schema.
 * This is the contract between the Forge agent and the seed template system.
 *
 * The Forge generates this JSON, and a deterministic script
 * injects it into the seed template. No LLM touches HTML/CSS directly.
 * However, custom_sections allow the Coder agent to extend beyond blocks.
 */
export const delusionConfigSchema = z.object({
  /** Schema version for forward compatibility */
  version: z.string().default('1.0.0'),

  /** Site metadata */
  site_name: z.string().describe('Site title shown in browser tab'),
  site_description: z.string().optional().describe('Meta description for SEO'),
  site_url: z.string().optional().describe('Production URL once deployed'),

  /** Business information */
  business: businessSchema,

  /** Theme configuration */
  theme: themeSchema.default({}),

  /** SEO configuration */
  seo: z.object({
    og_image: z.string().optional().describe('OpenGraph image URL'),
    google_site_verification: z.string().optional(),
    noindex: z.boolean().default(false),
  }).default({}),

  /** Page sections — ordered list of blocks with their props */
  sections: z.array(sectionSchema).min(1).describe('Page sections using @delusion/blocks'),

  /** Custom sections beyond existing blocks — Coder agent handles these */
  custom_sections: z.array(z.object({
    name: z.string().describe('Feature name (e.g. "booking-calendar")'),
    description: z.string().describe('What the client needs — Coder will implement'),
    placement: z.enum(['before', 'after']).default('after'),
    after_section: z.number().optional().describe('Insert after which section index'),
  })).optional().describe('Features not in @delusion/blocks — routed to Coder'),

  /** Seed metadata */
  seed: z.object({
    /** Which layout type to use (landing, site, shop) */
    layout: z.string().default('landing'),
    /** Which business template to base on (restaurant, bakery, salon) */
    template: z.string().describe('Business-type seed template'),
    /** NPM version of the seed used — for tracking and global upgrades */
    version: z.string().default('0.1.0').describe('Locked seed version for this tenant'),
  }),

  /** Feature flags */
  i18n_enabled: z.boolean().default(false).describe('Enable multi-language support'),
});

export type DelusionConfig = z.infer<typeof delusionConfigSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Business = z.infer<typeof businessSchema>;
