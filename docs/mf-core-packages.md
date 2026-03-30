---
title: Module Federation Core Package Map
summary: Inventory and categorization of module-federation/core packages relevant to Astro integration work.
read_when:
  - Designing/expanding @module-federation/astro
  - Choosing runtime vs framework-specific dependencies
source:
  - /Users/nsttt/work/core/packages
updated_at: 2026-03-05
---

# Module Federation Core Package Map

Snapshot source: `/Users/nsttt/work/core/packages`.

## Counts

- Total packages with `package.json`: `36`
- Private/internal: `2` (`@module-federation/core`, `@changesets/assemble-release-plan`)
- Public packages: `34`

## Core Runtime Stack (use first)

- `@module-federation/runtime-core`: low-level runtime contract
- `@module-federation/runtime`: runtime API wrapper used by bundler plugins
- `@module-federation/sdk`: shared helpers/types used by plugins
- `@module-federation/enhanced`: webpack/rspack plugin layer
- `@module-federation/webpack-bundler-runtime`: webpack-oriented runtime bridge

## Build/Bundler Integrations

- `@module-federation/rspack`
- `@module-federation/rsbuild-plugin`
- `@module-federation/esbuild`
- `@module-federation/modern-js`
- `@module-federation/modern-js-v3`
- `@module-federation/nextjs-mf`
- `@module-federation/metro`
- `@module-federation/metro-plugin-rnef`
- `@module-federation/metro-plugin-rnc-cli`
- `@module-federation/rspress-plugin`

## Tooling / DX / Types

- `@module-federation/cli`
- `create-module-federation`
- `@module-federation/typescript`
- `@module-federation/dts-plugin`
- `@module-federation/manifest`
- `@module-federation/managers`
- `@module-federation/error-codes`
- `@module-federation/devtools`
- `@module-federation/storybook-addon`
- `@module-federation/retry-plugin`

## Runtime Extensions / Perf / Data

- `@module-federation/data-prefetch`
- `@module-federation/node`
- `@module-federation/runtime-tools`
- `@module-federation/treeshake-frontend`
- `@module-federation/treeshake-server`
- `@module-federation/third-party-dts-extractor`

## For `@module-federation/astro` (recommended pull-in order)

1. `@module-federation/vite` for bundler glue.
2. `@module-federation/runtime` for runtime APIs (`loadRemote`, `registerRemotes`, etc.).
3. `@module-federation/sdk` only if extra config normalization/helpers needed.
4. Avoid direct dependency on `@module-federation/core` (private/internal).

## Notes

- Core repo already includes multiple framework/bundler adapters; Astro package should stay thin.
- Keep Astro package as integration glue + Astro-specific normalization/lifecycle behavior.
