import { defineCollection, z } from 'astro:content';

const sectionSchema = z.object({
  block: z.string(),
  props: z.record(z.unknown()),
  order: z.number().optional(),
});

const themeSchema = z.object({
  preset: z.string().default('light'),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  font: z.string().optional(),
});

const businessSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  hours: z.record(z.string()).optional(),
  social: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

const delusionConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  site_name: z.string(),
  site_description: z.string().optional(),
  site_url: z.string().optional(),
  
  business: businessSchema,
  theme: themeSchema.default({}),
  
  seo: z.object({
    og_image: z.string().optional(),
    google_site_verification: z.string().optional(),
    noindex: z.boolean().default(false),
  }).default({}),

  sections: z.array(sectionSchema).min(1),

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
  }),

  i18n_enabled: z.boolean().default(false),
});

const businessCollection = defineCollection({
  type: 'data',
  schema: delusionConfigSchema,
});

export const collections = {
  business: businessCollection,
};
