// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import { moduleFederation } from '@module-federation/astro';

export default defineConfig({
  output: 'server',
  server: {
    port: 4332,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    },
  },
  preview: {
    port: 4332,
    strictPort: true,
  },
  vite: {
    server: {
      cors: true,
      origin: 'http://localhost:4332',
    },
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    moduleFederation({
      name: 'react_remote',
      filename: 'remoteEntry.js',
      publicPath: 'http://localhost:4332/',
      varFilename: 'remoteEntry.global.js',
      manifest: true,
      dts: false,
      exposes: {
        './components/CounterCard': './src/components/CounterCard.tsx',
      },
    }),
  ],
});
