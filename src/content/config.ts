import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.union([z.string(), z.number()]),
    role: z.string(),
    categories: z.array(z.string()).default([]),
    stack: z.array(z.string()),
    repoUrl: z.string().optional(),
    liveUrl: z.string().optional(),
    featured: z.boolean().default(false),
    comingSoon: z.boolean().default(false),
  }),
});

export const collections = {
  projects: projectsCollection,
};
