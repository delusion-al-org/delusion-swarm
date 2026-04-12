import { z, defineCollection } from 'astro:content';

/**
 * businessCollection — adapts Forge-generated delusion.json into the seed.
 * The hydrator writes this file; when present it drives the full site config.
 * Schema mirrors swarm/src/mastra/schemas/delusion-config.ts (keep in sync).
 */
const businessCollection = defineCollection({
  type: 'data',
  schema: z.object({
    version: z.string().default('1.0.0'),
    site_name: z.string(),
    site_description: z.string().optional(),
    site_url: z.string().optional(),
    business: z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      hours: z.record(z.string()).optional(),
      social: z.object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        website: z.string().optional(),
      }).optional(),
    }),
    theme: z.object({
      preset: z.string().default('light'),
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      font: z.string().optional(),
    }).default({}),
    seo: z.object({
      og_image: z.string().optional(),
      google_site_verification: z.string().optional(),
      noindex: z.boolean().default(false),
    }).default({}),
    sections: z.array(z.object({
      type: z.string(),
      props: z.record(z.unknown()).default({}),
      order: z.number().optional(),
    })).min(1),
    custom_sections: z.array(z.object({
      name: z.string(),
      description: z.string(),
      placement: z.enum(['before', 'after']).default('after'),
      after_section: z.number().optional(),
    })).optional(),
    seed: z.object({
      layout: z.string().default('landing'),
      template: z.string(),
      version: z.string().default('0.1.0'),
    }).optional(),
    i18n_enabled: z.boolean().default(false),
  }),
});

const configCollection = defineCollection({
  type: 'data',
  schema: z.object({
    site_name: z.string(),
    description: z.string(),
    language: z.string().default('es'),
    seo: z.object({
      noindex: z.boolean().default(false),
      og_image: z.string().url().optional(),
    }).default({ noindex: false }),
    social_links: z.record(z.string().url()).optional(),
    flags: z.record(z.boolean()).optional(),
  }),
});

const themeCollection = defineCollection({
  type: 'data',
  schema: z.object({ theme: z.string() }),
});

// The dynamic abstract block structure
const blockSchema = z.object({
  type: z.string(), // e.g. "HeroSection"
  props: z.record(z.any()).default({}), // The JSON data mapped to the component
});

const pagesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string().optional(),
    path: z.string(), // E.g., "/", "/about"
    blocks: z.array(blockSchema),
  }),
});

export const collections = {
  business: businessCollection,
  config: configCollection,
  theme: themeCollection,
  pages: pagesCollection,
};
