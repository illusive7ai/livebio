import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The same two addresses the build writes in, so tests see what the extension sees.
  define: {
    __SERVICE_URL__: JSON.stringify('https://service.example'),
    __SITE_URL__: JSON.stringify('https://site.example/livebio/'),
  },
  test: { include: ['src/**/*.test.ts'] },
});
