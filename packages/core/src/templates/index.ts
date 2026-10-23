import type { Template } from '../types';
import { brief } from './brief';
import { city } from './city';
import { maintainer } from './maintainer';
import { minimal } from './minimal';
import { neofetch } from './neofetch';
import { showcase } from './showcase';
import { terminal } from './terminal';

export const templates: Template[] = [showcase, city, maintainer, brief, terminal, neofetch, minimal];

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
