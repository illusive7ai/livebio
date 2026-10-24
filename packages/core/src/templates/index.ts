import type { Template } from '../types';
import { withLive, type LiveSpec } from '../live/compose';
import { arcadeTemplates } from './arcade';
import { creative, erased } from './artwork';
import { worldTemplates } from './worlds';
import { deviceTemplates } from './devices';
import { dataArtTemplates } from './dataart';
import { documentTemplates } from './documents';
import { brief } from './brief';
import { buildlog } from './buildlog';
import { chartTemplates } from './charts';
import { city } from './city';
import { frontpage, hub } from './editorial';
import { interfaceTemplates } from './interfaces';
import { galaxy } from './galaxy';
import { launchpad } from './launchpad';
import { learning } from './learning';
import { lensTemplates } from './lenses';
import { maintainer } from './maintainer';
import { minimal } from './minimal';
import { neofetch } from './neofetch';
import { paperTemplates } from './paper';
import { scrapbookTemplates } from './scrapbook';
import { captip, cinematic, signature, wow } from './showpieces';
import { signalTemplates } from './signals';
import { showcase } from './showcase';
import { imageryTemplates } from './imagery';
import { printTemplates } from './print';
import { plotTemplates } from './plots';
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
  player: { preset: 'glow', city: true, companion: 'chess', shift: 300 },
  inbox: { preset: 'night', city: true, companion: 'snake', shift: 212 },
  desktop: { preset: 'terminal', city: true, companion: 'chess', shift: 170 },
  cockpit: { preset: 'blueprint', city: true, companion: 'snake', shift: 150 },
  metro: { preset: 'plain', city: true, companion: 'chess', shift: 200 },
  elements: { preset: 'chalk', city: true, companion: 'snake', shift: 260 },
  treemap: { preset: 'editor', city: true, companion: 'chess', shift: 120 },
  shelf: { preset: 'paper', city: true, companion: 'snake', shift: 28 },
  card: { preset: 'glow', city: true, companion: 'chess', shift: 265 },
  polaroids: { preset: 'sunrise', city: true, companion: 'snake', shift: 30 },
  comic: { preset: 'arcade', city: true, companion: 'chess', shift: 12 },
  wanted: { preset: 'sunrise', city: true, companion: 'chess', shift: 44 },
  recipe: { preset: 'paper', city: true, companion: 'snake', shift: 12 },
  nutrition: { preset: 'plain', city: true, companion: 'chess', shift: 140 },
  postcard: { preset: 'aurora', city: true, companion: 'snake', shift: 205 },
  ransom: { preset: 'arcade', city: true, companion: 'chess', shift: 350 },
  departures: { preset: 'terminal', city: true, companion: 'snake', shift: 5 },
  handheld: { preset: 'arcade', city: true, companion: 'chess', shift: 10 },
  neon: { preset: 'glow', city: true, companion: 'snake', shift: 15 },
  laptop: { preset: 'aurora', city: true, companion: 'chess', shift: 20 },
  pet: { preset: 'sunrise', city: true, companion: 'snake', shift: 35 },
  garden: { preset: 'paper', city: true, companion: 'chess', shift: 50 },
  ridgeline: { preset: 'plain', city: true, companion: 'snake', shift: 55 },
  pulse: { preset: 'terminal', city: true, companion: 'chess', shift: 60 },
  drums: { preset: 'night', city: true, companion: 'snake', shift: 65 },
  weather: { preset: 'aurora', city: true, companion: 'chess', shift: 70 },
  rings: { preset: 'night', city: true, companion: 'snake', shift: 75 },
  tree: { preset: 'chalk', city: true, companion: 'chess', shift: 85 },
  aquarium: { preset: 'space', city: true, companion: 'snake', shift: 90 },
  island: { preset: 'paper', city: true, companion: 'chess', shift: 100 },
  circuit: { preset: 'blueprint', city: true, companion: 'snake', shift: 105 },
  sonar: { preset: 'terminal', city: true, companion: 'chess', shift: 110 },
  cloud: { preset: 'plain', city: true, companion: 'snake', shift: 115 },
  timeline: { preset: 'editor', city: true, companion: 'chess', shift: 125 },
  sunburst: { preset: 'glow', city: true, companion: 'snake', shift: 130 },
  mosaic: { preset: 'arcade', city: true, companion: 'chess', shift: 135 },
  moodboard: { preset: 'paper', city: true, companion: 'chess', shift: 3 },
  riso: { preset: 'sunrise', city: true, companion: 'snake', shift: 6 },
  glitch: { preset: 'terminal', city: true, companion: 'chess', shift: 9 },
  thermal: { preset: 'glow', city: true, companion: 'snake', shift: 12 },
  halftone: { preset: 'night', city: true, companion: 'chess', shift: 15 },
  zine: { preset: 'sunrise', city: true, companion: 'snake', shift: 18 },
  contact: { preset: 'plain', city: true, companion: 'chess', shift: 21 },
  museum: { preset: 'paper', city: true, companion: 'snake', shift: 24 },
  patch: { preset: 'blueprint', city: true, companion: 'chess', shift: 27 },
  lock: { preset: 'aurora', city: true, companion: 'snake', shift: 30 },
  topo: { preset: 'terminal', city: true, companion: 'chess', shift: 33 },
  natal: { preset: 'space', city: true, companion: 'snake', shift: 36 },
  stitch: { preset: 'paper', city: true, companion: 'chess', shift: 39 },
  punch: { preset: 'editor', city: true, companion: 'snake', shift: 42 },
  plinko: { preset: 'night', city: true, companion: 'chess', shift: 45 },
};

const bases: Template[] = [showcase, launchpad, city, galaxy, snake, learning, buildlog, maintainer, brief, terminal, neofetch, minimal, ...lensTemplates, ...arcadeTemplates, cinematic, wow, signature, captip, frontpage, hub, creative, erased, ...documentTemplates, ...interfaceTemplates, ...dataArtTemplates, ...scrapbookTemplates, ...paperTemplates, ...deviceTemplates, ...signalTemplates, ...worldTemplates, ...chartTemplates, ...imageryTemplates, ...printTemplates, ...plotTemplates];

export const templates: Template[] = bases.map((template) => {
  const spec = LIVE[template.id];
  if (!spec) throw new Error(`Template "${template.id}" has no live preset`);
  return withLive(template, spec);
});

/** The game a design carries when nothing is chosen, or null for a design that is itself a game or carries none. */
export function defaultCompanion(id: string): 'snake' | 'chess' | null {
  return LIVE[id]?.companion ?? null;
}

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
