import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        showcase: z.object({
          title: z.string(),
          order: z.number().optional(),
          items: z.array(z.string()),
          authors: z.array(z.object({
            name: z.string(),
            age: z.number().optional(),
          }))
        }).optional(),
        authors: z.array(z.object({
          slug: z.string(),
          username: z.string(),
          name: z.string(),
          to: z.string(),
          avatar: z.object({
            src: z.string(),
            alt: z.string(),
          }),
        })),
      })
    })
  }
})