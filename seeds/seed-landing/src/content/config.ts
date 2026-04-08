import { defineCollection, z } from 'astro:content';

const businessSchema = z.object({
  site: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    primary_color: z.string().optional(),
    font_family: z.string().optional(),
  }),
  seo: z.object({
    og_image: z.string().url().optional(),
    google_site_verification: z.string().optional(),
    noindex: z.boolean().default(false),
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    map_url: z.string().url().optional(),
  }),
  content: z.record(z.any()).optional(),
  i18n_enabled: z.boolean().default(false),
});

const businessCollection = defineCollection({
  type: 'data',
  schema: businessSchema,
});

export const collections = {
  business: businessCollection,
};
