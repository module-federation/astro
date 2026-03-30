# Astro Module Federation

Repo: `module-federation/astro`

Workspace orchestration: Turborepo (`turbo` + `turbo.json`).
Plugin build: `tsdown` (`packages/astro/tsdown.config.ts`).

Module Federation plugin: `@module-federation/vite`.
Astro bridge package in this repo: `@module-federation/astro`.
Published package source: `packages/astro`.
Example apps: `apps/example` (see `apps/example/README.md`).

## Package usage

```ts
import { defineConfig } from 'astro/config';
import { moduleFederation } from '@module-federation/astro';

export default defineConfig({
  integrations: [
    moduleFederation({
      name: 'astro_host',
      remotes: {
        astro_remote: 'astro_remote@http://localhost:4322/mf-manifest.json',
      },
    }),
  ],
});
```

## Behavior

- Remote strings are normalized to explicit MF remote objects.
- `dts` defaults to `false`.
- Host auto-init is injected into Astro `page` stage so `.astro` script imports work in dev.
- SSR remote imports in Astro frontmatter are handled by an SSR transform path in `@module-federation/astro`.
- That SSR path supports remote Astro components as well as plain server functions, including `await import('remote/Component')` followed by `<Component />`.
- Dev target defaults to runtime inference (`ENV_TARGET = undefined`) so client/server contexts can coexist.

## Build checks

```bash
pnpm --filter @module-federation/astro build
pnpm --filter @module-federation/astro test
```

## Release flow

- Versioning: Changesets (`pnpm changeset`)
- Release PR: GitHub Actions `Release Pull Request`
- Publish: GitHub Actions `Publish (GitHub Release)`
- Release notes + operational details: `docs/RELEASING.md`

## Non-Astro SSR providers

- For remote providers built outside Astro, the important contract is an MF manifest with `ssrRemoteEntry`.
- `mf-vite` already emits `ssrRemoteEntry` in its manifest, and MF runtime prefers that entry on the server.
- Rsbuild/Rslib providers should emit SSR assets with `target: 'dual'` (or legacy `ssr: true`).
- Astro as consumer keeps using MF runtime on the server; the loaded module can then be rendered as `<Component />` if it exports a server-renderable component.
