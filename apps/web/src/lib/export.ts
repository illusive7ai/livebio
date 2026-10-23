import { strToU8, zipSync } from 'fflate';
import { configToYaml, workflowYaml, type Config, type Output } from '@livebio/core';

/** Every file the user needs in their `username/username` repository. */
export function buildFiles(output: Output, config: Config): Record<string, string> {
  const files: Record<string, string> = {
    'README.md': output.readme,
    'livebio.yml': configToYaml(config),
    '.github/workflows/livebio.yml': workflowYaml(),
  };
  for (const asset of output.assets) files[asset.path] = asset.content;
  return files;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadZip(files: Record<string, string>, username: string): void {
  const zipped = zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])));
  download(new Blob([zipped as BlobPart], { type: 'application/zip' }), `${username}-livebio.zip`);
}

export function downloadReadme(readme: string): void {
  download(new Blob([readme], { type: 'text/markdown' }), 'README.md');
}

export function downloadText(filename: string, text: string): void {
  download(new Blob([text], { type: 'text/plain' }), filename);
}
