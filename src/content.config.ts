import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { animationSchema, proposalSchema } from './schema.ts';

const animations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/animations' }),
  schema: animationSchema,
});
const proposals = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/proposals' }),
  schema: proposalSchema,
});

export const collections = { animations, proposals };
