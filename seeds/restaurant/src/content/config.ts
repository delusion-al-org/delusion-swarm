import { defineCollection, z } from 'astro:content';

const businessCollection = defineCollection({
  type: 'data',
  schema: z.object({
    site: z.object({
      title: z.string(),
      description: z.string(),
      url: z.string().url(),
      primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Debe ser un código hex válido"),
      font_family: z.string().optional()
    }),
    seo: z.object({
      og_image: z.string().optional(),
      google_site_verification: z.string().optional(),
      noindex: z.boolean().default(false)
    }),
    contact: z.object({
      phone: z.string(),
      email: z.string().email(),
      address: z.string(),
      map_url: z.string().url().optional()
    }),
    content: z.object({
      hero: z.object({
        headline: z.string(),
        subheadline: z.string(),
        cta_text: z.string()
      }),
      features: z.array(z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional()
      }))
    })
  })
});

export const collections = {
  'business': businessCollection,
};
