import { describe, expect, it } from 'vitest';
import { ConfigError, configToYaml, defaultConfig, parseConfig, parseConfigYaml } from './config';

describe('parseConfig', () => {
  it('fills in defaults, with the credit footer on', () => {
    expect(parseConfig({ username: 'octo' })).toEqual(defaultConfig('octo'));
    expect(parseConfig({ username: 'octo' }).credit).toBe(true);
  });

  it('round-trips through YAML', () => {
    const config = { ...defaultConfig('octo', 'minimal'), theme: 'dark' as const, text: { headline: 'Hi' } };
    expect(parseConfigYaml(configToYaml(config))).toEqual(config);
  });

  it.each([
    ['not an object', 'text'],
    ['a list', []],
    ['no username', {}],
    ['a bad username', { username: '../x' }],
    ['a bad theme', { username: 'octo', theme: 'neon' }],
    ['a non-boolean flag', { username: 'octo', motion: 'yes' }],
    ['an unknown block', { username: 'octo', blocks: ['stats', 'nope'] }],
    ['an overlong headline', { username: 'octo', text: { headline: 'x'.repeat(201) } }],
  ])('rejects %s', (_label, input) => {
    expect(() => parseConfig(input)).toThrow(ConfigError);
  });

  it('rejects YAML that does not parse', () => {
    expect(() => parseConfigYaml('username: [unclosed')).toThrow(ConfigError);
  });

  it('removes duplicate blocks and keeps their order', () => {
    expect(parseConfig({ username: 'octo', blocks: ['projects', 'stats', 'projects'] }).blocks).toEqual([
      'projects',
      'stats',
    ]);
  });
});
