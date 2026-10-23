import type { Template } from '../types';
import { brief } from './brief';
import { minimal } from './minimal';
import { neofetch } from './neofetch';
import { showcase } from './showcase';
import { terminal } from './terminal';

export const templates: Template[] = [showcase, brief, terminal, neofetch, minimal];

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
