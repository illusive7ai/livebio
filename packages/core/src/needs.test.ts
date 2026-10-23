import { describe, expect, it } from 'vitest';
import { defaultConfig, needsContributions } from './config';

describe('needsContributions', () => {
  const config = (blocks: Parameters<typeof defaultConfig>[0] extends string ? ReturnType<typeof defaultConfig>['blocks'] : never) => ({ ...defaultConfig('octo'), blocks });

  it('is true for a default config', () => {
    expect(needsContributions(defaultConfig('octo'))).toBe(true);
  });

  it('is true when any block that draws the calendar is on, even without the activity section', () => {
    expect(needsContributions(config(['city']))).toBe(true);
    expect(needsContributions(config(['game']))).toBe(true);
    expect(needsContributions(config(['stats', 'city']))).toBe(true);
    expect(needsContributions(config(['activity']))).toBe(true);
  });

  it('is false when none of them is on, so no token quota is spent', () => {
    expect(needsContributions(config([]))).toBe(false);
    expect(needsContributions(config(['stats', 'languages', 'projects']))).toBe(false);
  });
});
