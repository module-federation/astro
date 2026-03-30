# Astro Module Federation PoC (2 Astro apps)

`host` and `remote` are both Astro apps:

- Host app: `apps/host` (`http://localhost:4321`)
- Remote app: `apps/remote` (`http://localhost:4322`)
- Astro integration package: `packages/astro` (`@module-federation/astro`)

Module Federation plugin: `@module-federation/vite`.
Astro bridge package in this repo: `@module-federation/astro`.

## Run

1. Install:

```bash
pnpm install
```

2. Start both apps from the root:

```bash
pnpm dev
```

This starts:

- remote on `4322`
- host on `4321`

3. Or start remote only:

```bash
pnpm dev:remote
```

4. Start host only (new terminal):

```bash
pnpm dev:host
```

Both apps use fixed ports with `strictPort: true`.
If `4321` or `4322` is already taken, Astro now fails fast instead of silently moving to another port and breaking federation URLs.

4. Open:

- Host: `http://localhost:4321`
- Remote standalone: `http://localhost:4322`
- Host SSR static import page: `http://localhost:4321/ssr`
- Host SSR dynamic import page: `http://localhost:4321/ssr-dynamic`
- Host SSR component static import page: `http://localhost:4321/astro-component`
- Host SSR component dynamic import page: `http://localhost:4321/astro-component-dynamic`

## Build checks

```bash
pnpm build:remote
pnpm build:host
```

## Federation wiring

- Remote exposes `./widget`, `./server`, and `./RemoteCard` in `apps/remote/astro.config.mjs`.
- Host consumes `astro_remote/widget` from an Astro page script (`apps/host/src/pages/index.astro`).
- Host consumes `astro_remote/server` from Astro frontmatter (`apps/host/src/pages/ssr*.astro`).
- Host consumes `astro_remote/RemoteCard` directly from Astro syntax (`apps/host/src/pages/astro-component.astro`).
- Host also consumes `astro_remote/RemoteCard` via `await import()` in Astro frontmatter and renders it as `<RemoteCard />` (`apps/host/src/pages/astro-component-dynamic.astro`).
- Host remote mapping lives in `apps/host/astro.config.mjs` via `mf-manifest.json`.

## DTS wiring

- Remote generates federated types (`dts.generateTypes`) from typed exposes in `apps/remote/src/*.ts`.
- Astro `.astro` exposes are auto-wrapped by `@module-federation/astro` for DTS generation, so end users can keep direct `.astro` exposes with `dts: true`.
- Host consumes federated types (`dts.consumeTypes`) and maps module specifiers in `apps/host/tsconfig.json`:
  - `astro_remote/*` -> `./@mf-types/astro_remote/*`
- Host uses `consumeTypes.family: 6` and explicit `remoteTypeUrls` for dev zip download.
- Type smoke-check:

```bash
pnpm --filter @poc/host exec tsc --noEmit
```

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

## Astro integration behavior

- Remote strings are normalized to explicit MF remote objects.
- `dts` defaults to `false`.
- Host auto-init is injected into Astro `page` stage so `.astro` script imports work in dev.
- SSR remote imports in Astro frontmatter are handled by an SSR transform path in `@module-federation/astro`.
- That SSR path supports remote Astro components as well as plain server functions, including `await import('remote/Component')` followed by `<Component />`.
- Dev target defaults to runtime inference (`ENV_TARGET = undefined`) so client/server contexts can coexist.

## Non-Astro SSR providers

- For remote providers built outside Astro, the important contract is an MF manifest with `ssrRemoteEntry`.
- `mf-vite` already emits `ssrRemoteEntry` in its manifest, and MF runtime prefers that entry on the server.
- Rsbuild/Rslib providers should emit SSR assets with `target: 'dual'` (or legacy `ssr: true`).
- Astro as consumer keeps using MF runtime on the server; the loaded module can then be rendered as `<Component />` if it exports a server-renderable component.
