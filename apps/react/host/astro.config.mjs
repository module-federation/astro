// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import { moduleFederation } from '@module-federation/astro';

export default defineConfig({
  output: 'server',
  server: {
    port: 4331,
    strictPort: true,
  },
  preview: {
    port: 4331,
    strictPort: true,
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    moduleFederation({
      name: 'react_host',
      remotes: {
        react_remote: 'react_remote@http://localhost:4332/mf-manifest.json',
      },
      ssr: {
        localRemotes: {
          react_remote: '../remote',
        },
      },
    }),
  ],
});
