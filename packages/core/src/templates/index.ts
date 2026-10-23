import type { Template } from '../types';
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

export const templates: Template[] = [showcase, launchpad, city, galaxy, snake, learning, buildlog, maintainer, brief, terminal, neofetch, minimal];

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
