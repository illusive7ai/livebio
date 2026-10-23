import type { Template } from '../types';
import { withLive, type LiveSpec } from '../live/compose';
import { brief } from './brief';
import { buildlog } from './buildlog';
import { city } from './city';
import { galaxy } from './galaxy';
import { launchpad } from './launchpad';
import { learning } from './learning';
import { maintainer } from './maintainer';
import { minimal } from './minimal';
import { neofetch } from './neofetch';
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
};

const bases: Template[] = [showcase, launchpad, city, galaxy, snake, learning, buildlog, maintainer, brief, terminal, neofetch, minimal];

export const templates: Template[] = bases.map((template) => {
  const spec = LIVE[template.id];
  if (!spec) throw new Error(`Template "${template.id}" has no live preset`);
  return withLive(template, spec);
});

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
