import { z, defineCollection } from 'astro:content';

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
  config: configCollection,
  theme: themeCollection,
  pages: pagesCollection,
};
