# Example apps

This folder contains the first end-to-end Astro Module Federation example set.

- Host app: `apps/example/host` (`http://localhost:4321`)
- Remote app: `apps/example/remote` (`http://localhost:4322`)

## Run

1. Install dependencies from the repo root:

```bash
pnpm install
```

2. Start both apps from the repo root:

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

4. Start host only:

```bash
pnpm dev:host
```

Both apps use fixed ports with `strictPort: true`.
If `4321` or `4322` is taken, Astro fails fast instead of silently moving and breaking federation URLs.

## Routes

- Host: `http://localhost:4321`
- Remote standalone: `http://localhost:4322`
- Host SSR static import page: `http://localhost:4321/ssr`
- Host SSR dynamic import page: `http://localhost:4321/ssr-dynamic`
- Host SSR component static import page: `http://localhost:4321/astro-component`
- Host SSR component dynamic import page: `http://localhost:4321/astro-component-dynamic`

## Example wiring

- Remote exposes `./widget`, `./server`, and `./RemoteCard` in `apps/example/remote/astro.config.mjs`.
- Host consumes `astro_remote/widget` from a page script in `apps/example/host/src/pages/index.astro`.
- Host consumes `astro_remote/server` from Astro frontmatter in `apps/example/host/src/pages/ssr*.astro`.
- Host consumes `astro_remote/RemoteCard` directly from Astro syntax in `apps/example/host/src/pages/astro-component.astro`.
- Host also consumes `astro_remote/RemoteCard` via `await import()` in Astro frontmatter and renders it as `<RemoteCard />` in `apps/example/host/src/pages/astro-component-dynamic.astro`.
- Host remote mapping lives in `apps/example/host/astro.config.mjs` via `mf-manifest.json`.

## DTS wiring

- Remote generates federated types (`dts.generateTypes`) from typed exposes in `apps/example/remote/src/*.ts`.
- Astro `.astro` exposes are auto-wrapped by `@module-federation/astro` for DTS generation, so users can expose `.astro` files directly with `dts: true`.
- Host consumes federated types (`dts.consumeTypes`) and maps module specifiers in `apps/example/host/tsconfig.json`.
  `astro_remote/*` -> `./@mf-types/astro_remote/*`
- Host uses `consumeTypes.family: 6` and explicit `remoteTypeUrls` for dev zip download.

Type smoke-check:

```bash
pnpm --filter example-host exec tsc --noEmit
```
