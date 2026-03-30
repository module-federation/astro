// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { moduleFederation } from '@module-federation/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 4321,
    strictPort: true,
  },
  preview: {
    port: 4321,
    strictPort: true,
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    moduleFederation({
        name: 'astro_host',
        remotes: {
          astro_remote: 'astro_remote@http://localhost:4322/mf-manifest.json',
        },
        ssr: {
          localRemotes: {
            astro_remote: '../remote',
          },
        },
        dts: {
          tsConfigPath: './tsconfig.json',
          generateTypes: false,
          consumeTypes: {
            abortOnError: false,
            family: 6,
            maxRetries: 20,
            remoteTypeUrls: {
              astro_remote: {
                alias: 'astro_remote',
                zip: 'http://localhost:4322/dist/@mf-types.zip',
                api: 'http://localhost:4322/dist/@mf-types.d.ts',
              },
            },
          },
        },
      }),
  ],
});
