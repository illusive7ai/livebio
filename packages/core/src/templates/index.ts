import type { Template } from '../types';
import { withLive, type LiveSpec } from '../live/compose';
import { arcadeTemplates } from './arcade';
import { creative, erased } from './artwork';
import { documentTemplates } from './documents';
import { brief } from './brief';
import { buildlog } from './buildlog';
import { city } from './city';
import { frontpage, hub } from './editorial';
import { galaxy } from './galaxy';
import { launchpad } from './launchpad';
import { learning } from './learning';
import { lensTemplates } from './lenses';
import { maintainer } from './maintainer';
import { minimal } from './minimal';
import { neofetch } from './neofetch';
import { captip, cinematic, signature, wow } from './showpieces';
import { showcase } from './showcase';
import { snake } from './snake';
import { terminal } from './terminal';

/**
 * Every template carries a live contribution city plus one automated game, in a look of its own.
 * The two that already are the city or the snake carry only what they are missing.
 */
const LIVE: Record<string, LiveSpec> = {
  showcase: { preset: 'aurora', city: true, companion: 'chess' },
  launchpad: { preset: 'sunrise', city: true, companion: 'snake' },
  city: { preset: 'night', city: false, companion: 'chess' },
  galaxy: { preset: 'space', city: true, companion: 'snake' },
  snake: { preset: 'arcade', city: true, companion: null },
  learning: { preset: 'chalk', city: true, companion: 'chess' },
  buildlog: { preset: 'editor', city: true, companion: 'snake' },
  maintainer: { preset: 'blueprint', city: true, companion: 'chess' },
  brief: { preset: 'paper', city: true, companion: 'chess' },
  terminal: { preset: 'terminal', city: true, companion: 'snake' },
  neofetch: { preset: 'glow', city: true, companion: 'chess' },
  minimal: { preset: 'plain', city: true, companion: 'snake' },
  frontend: { preset: 'aurora', city: true, companion: 'chess', shift: 14 },
  backend: { preset: 'sunrise', city: true, companion: 'snake', shift: 31 },
  devops: { preset: 'terminal', city: true, companion: 'snake', shift: 47 },
  datalab: { preset: 'glow', city: true, companion: 'chess', shift: 63 },
  indie: { preset: 'arcade', city: true, companion: 'snake', shift: 79 },
  animatedfrontend: { preset: 'glow', city: true, companion: 'chess', shift: 96 },
  product: { preset: 'night', city: true, companion: 'chess', shift: 112 },
  advocate: { preset: 'space', city: true, companion: 'chess', shift: 128 },
  framework: { preset: 'blueprint', city: true, companion: 'snake', shift: 144 },
  ossbuilder: { preset: 'editor', city: true, companion: 'snake', shift: 160 },
  ossproof: { preset: 'blueprint', city: true, companion: 'chess', shift: 176 },
  founder: { preset: 'paper', city: true, companion: 'chess', shift: 192 },
  spaceshooter: { preset: 'space', city: true, companion: 'chess', shift: 208 },
  jetrunner: { preset: 'sunrise', city: true, companion: 'chess', shift: 224 },
  playablesignal: { preset: 'arcade', city: true, companion: 'chess', shift: 240 },
  cinematic: { preset: 'night', city: true, companion: 'chess', shift: 256 },
  wow: { preset: 'glow', city: true, companion: 'snake', shift: 272 },
  signature: { preset: 'aurora', city: true, companion: 'snake', shift: 288 },
  captip: { preset: 'sunrise', city: true, companion: 'chess', shift: 304 },
  frontpage: { preset: 'paper', city: true, companion: 'chess', shift: 320 },
  hub: { preset: 'plain', city: true, companion: 'snake', shift: 336 },
  creative: { preset: 'aurora', city: true, companion: 'chess', shift: 352 },
  erased: { preset: 'terminal', city: true, companion: 'chess', shift: 24 },
  passport: { preset: 'paper', city: true, companion: 'chess', shift: 8 },
  receipt: { preset: 'plain', city: true, companion: 'snake', shift: 40 },
  sheet: { preset: 'chalk', city: true, companion: 'chess', shift: 28 },
  calendar: { preset: 'sunrise', city: true, companion: 'snake', shift: 352 },
};

const bases: Template[] = [showcase, launchpad, city, galaxy, snake, learning, buildlog, maintainer, brief, terminal, neofetch, minimal, ...lensTemplates, ...arcadeTemplates, cinematic, wow, signature, captip, frontpage, hub, creative, erased, ...documentTemplates];

export const templates: Template[] = bases.map((template) => {
  const spec = LIVE[template.id];
  if (!spec) throw new Error(`Template "${template.id}" has no live preset`);
  return withLive(template, spec);
});

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
