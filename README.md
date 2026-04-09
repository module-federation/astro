# Astro Module Federation

Use Module Federation in Astro apps with `@module-federation/astro`, built on top of `@module-federation/vite`.

> [!IMPORTANT]
> `@module-federation/astro` is still in beta. Expect rough edges and API changes while the integration settles. Feedback, bugs, and edge cases are welcome in GitHub Issues for this repo.

## What you get

- Astro integration wrapper around Module Federation for host/remote setups.
- Dev/runtime wiring so `.astro` script imports and SSR remote imports work.
- Support for remote Astro components, server functions, and browser-side widgets.

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

## Example apps

- Host app: `apps/example/host` on `http://localhost:4321`
- Remote app: `apps/example/remote` on `http://localhost:4322`
- Start both from repo root with `pnpm dev`
- More example details: `apps/example/README.md`

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
- Publish: GitHub Actions `Release`
- Release notes + operational details: `docs/RELEASING.md`

## Non-Astro SSR providers

- For remote providers built outside Astro, the important contract is an MF manifest with `ssrRemoteEntry`.
- `mf-vite` already emits `ssrRemoteEntry` in its manifest, and MF runtime prefers that entry on the server.
- Rsbuild/Rslib providers should emit SSR assets with `target: 'dual'` (or legacy `ssr: true`).
- Astro as consumer keeps using MF runtime on the server; the loaded module can then be rendered as `<Component />` if it exports a server-renderable component.

## Repo layout

- Package: `packages/astro`
- Example apps: `apps/example`
- Main package README: `packages/astro/README.md`
- Release docs: `docs/RELEASING.md`
