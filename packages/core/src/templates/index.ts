import type { Template } from '../types';
import { minimal } from './minimal';
import { terminal } from './terminal';

export const templates: Template[] = [terminal, minimal];

export function getTemplate(id: string): Template | undefined {
  return templates.find((template) => template.id === id);
}
