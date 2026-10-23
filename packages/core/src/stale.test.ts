import { describe, expect, it } from 'vitest';
import { staleAssets } from './readme';

describe('staleAssets', () => {
  const written = ['livebio/showcase-dark.svg', 'livebio/showcase-light.svg', 'livebio/credit-dark.svg'];

  it('names the svg files in the livebio folder that this run did not write', () => {
    const existing = ['livebio/old-dark.svg', 'livebio/showcase-dark.svg', 'livebio/city-light.svg', 'livebio/credit-dark.svg'];
    expect(staleAssets(existing, written)).toEqual(['livebio/old-dark.svg', 'livebio/city-light.svg']);
  });

  it('keeps everything this run wrote', () => {
    expect(staleAssets(written, written)).toEqual([]);
  });

  it('never touches anything that is not an svg directly inside the folder', () => {
    const existing = ['README.md', 'livebio.yml', 'livebio/notes.txt', 'livebio/photo.png', 'livebio/sub/old-dark.svg', 'other/old-dark.svg', '.github/workflows/livebio.yml', 'livebio-extra/old.svg', 'livebio/', 'livebio/old.svg.bak', 'livebio/old.svgz', 'livebio/old.svg~', 'docs/livebio/old-dark.svg', 'x-livebio/old-dark.svg'];
    expect(staleAssets(existing, written)).toEqual([]);
  });

  it('treats Windows paths the same', () => {
    expect(staleAssets(['livebio\\old-dark.svg'], written)).toEqual(['livebio/old-dark.svg']);
    expect(staleAssets(['livebio/showcase-dark.svg'], ['livebio\\showcase-dark.svg'])).toEqual([]);
  });

  it('removes nothing when nothing is there, and everything old when nothing is written', () => {
    expect(staleAssets([], written)).toEqual([]);
    expect(staleAssets(['livebio/a-dark.svg', 'livebio/b-light.svg'], [])).toEqual(['livebio/a-dark.svg', 'livebio/b-light.svg']);
  });
});
