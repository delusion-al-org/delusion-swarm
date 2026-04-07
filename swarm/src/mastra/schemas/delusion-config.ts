import { z } from 'zod';

/**
 * Schema for a single section in a delusion site.
 * Each section maps to a block from @delusion/blocks.
 */
export const sectionSchema = z.object({
  block: z.string().describe('Block component name (e.g. "HeroSection", "MenuSection")'),
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

  /** Page sections — ordered list of blocks with their props */
  sections: z.array(sectionSchema).min(1).describe('Page sections using @delusion/blocks'),

  /** Seed metadata */
  seed: z.object({
    /** Which layout type to use (landing, portfolio, ecommerce) */
    layout: z.string().default('landing'),
    /** Which business template to base on (restaurant, bakery, salon) */
    template: z.string().describe('Business-type seed template'),
  }),
});

export type DelusionConfig = z.infer<typeof delusionConfigSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Business = z.infer<typeof businessSchema>;
