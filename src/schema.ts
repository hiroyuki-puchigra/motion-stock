import { z } from 'zod';
import { parts, triggers, moods, techs, costs, weights, sps, slugs } from './data/taxonomy.ts';

export const animationSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{3}$/),
  title: z.string().max(20),
  summary: z.string(),
  part: z.enum(slugs(parts)),
  trigger: z.array(z.enum(slugs(triggers))).min(1),
  mood: z.array(z.enum(slugs(moods))).min(1).max(3),
  tech: z.array(z.enum(techs)),
  cost: z.enum(slugs(costs)),
  weight: z.enum(slugs(weights)),
  sp: z.enum(slugs(sps)),
  useCases: z.array(z.string()),
  proposalNote: z.string(),
  reference: z.object({ url: z.string().url(), note: z.string() }),
  addedAt: z.string(),
  addedBy: z.string(),
}).refine((d) => d.id.startsWith(d.part + '-'), { message: 'id の接頭辞は part と一致させる' });

export const proposalSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+-[a-z0-9]{6}$/),
  title: z.string(),
  client: z.string(),
  createdAt: z.string(),
  intro: z.string(),
  items: z.array(z.object({ id: z.string(), place: z.string(), comment: z.string() })).min(1),
});
