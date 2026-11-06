// meta JSON のスキーマ検証（tsを直接読むため --experimental-strip-types を使用）
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { animationSchema, proposalSchema } from '../src/schema.ts';

const dir = new URL('../src/content/animations/', import.meta.url);
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  const r = animationSchema.safeParse(data);
  if (!r.success) { bad++; console.error(`✗ ${f}\n`, r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')); continue; }
  if (f !== `${data.id}.json`) { bad++; console.error(`✗ ${f}: ファイル名と id が不一致`); continue; }
  if (!existsSync(new URL(`../public/demos/${data.id}/index.html`, import.meta.url))) { bad++; console.error(`✗ ${f}: public/demos/${data.id}/index.html がありません`); continue; }
  console.log(`✓ ${f}`);
}

const ids = new Set(readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')));
const pdir = new URL('../src/content/proposals/', import.meta.url);
for (const f of existsSync(pdir) ? readdirSync(pdir).filter((f) => f.endsWith('.json')) : []) {
  const data = JSON.parse(readFileSync(new URL(f, pdir), 'utf8'));
  const r = proposalSchema.safeParse(data);
  if (!r.success) { bad++; console.error(`✗ proposals/${f}\n`, r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')); continue; }
  const missing = data.items.filter((i) => !ids.has(i.id)).map((i) => i.id);
  if (missing.length) { bad++; console.error(`✗ proposals/${f}: 存在しないid ${missing.join(', ')}`); continue; }
  if (f !== `${data.slug}.json`) { bad++; console.error(`✗ proposals/${f}: ファイル名と slug が不一致`); continue; }
  console.log(`✓ proposals/${f}`);
}
process.exit(bad ? 1 : 0);