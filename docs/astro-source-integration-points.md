---
title: Astro Source Integration Points for MF
summary: Astro internals map for where Module Federation integrations should hook and how script transforms behave.
read_when:
  - Building @module-federation/astro features
  - Debugging script import behavior in .astro files
source:
  - /Users/nsttt/git/astro/packages/astro/src
updated_at: 2026-03-05
---

# Astro Source Integration Points for MF

Primary source files:

- `/Users/nsttt/git/astro/packages/astro/src/config/index.ts`
- `/Users/nsttt/git/astro/packages/astro/src/integrations/hooks.ts`
- `/Users/nsttt/git/astro/packages/astro/src/core/create-vite.ts`
- `/Users/nsttt/git/astro/packages/astro/src/vite-plugin-astro/index.ts`
- `/Users/nsttt/git/astro/packages/astro/src/vite-plugin-integrations-container/index.ts`
- `/Users/nsttt/git/astro/packages/astro/src/vite-plugin-scripts/index.ts`

## Where Astro Integrations Hook In

`astro:config:setup` (from integrations) provides:

- `updateConfig(newConfig)` to merge Astro/Vite config.
- `injectScript(stage, content)` for script stages.
- `addRenderer`, `addClientDirective`, `injectRoute`, etc.

This is the correct point to attach Module Federation Vite plugin from `@module-federation/astro`.

## Vite Config Assembly Order (important)

From `create-vite.ts`, merge order:

1. Astro common Vite config
2. user `config.vite`
3. integration-provided config from `astro:config:setup`
4. command config

Implication:

- MF integration should be stable as an integration hook; no need to patch Astro internals.

## Why Bare Specifier Errors Happen in `.astro`

From Astro’s script handling (`vite-plugin-astro` + `vite-plugin-scripts`):

- Some script forms are emitted as plain script content/imports.
- If a remote specifier bypasses Vite federation transform, browser sees raw `astro_remote/widget`.

Working pattern:

- Put federated imports in Vite-processed client module (`src/scripts/*.js/ts`)
- Import that module via Astro processed `<script> import '../scripts/x.js' </script>`

Risky pattern:

- Rely on raw emitted inline script that never receives MF alias rewrite.

## Current SSR/CSR handling in `@module-federation/astro`

Implemented in this PoC package:

- inject MF host auto-init into Astro `page` stage so `.astro` page scripts can consume remotes in dev/build.
- keep `ENV_TARGET` as `undefined` in dev by default for mixed client/server context inference.
- SSR transform for federated `__loadRemote__` modules so `.astro` frontmatter imports can execute in server context.
- same SSR transform path works for remote Astro components, so `await import('remote/Component')` can feed `<Component />` rendering in host frontmatter.
- SSR source-loader fallback path for remote `.../server` modules in dev (`remoteBase/src/<module>.js`) to avoid current Node ESM loader/runtime friction.

## Remaining Constraints

- SSR path depends on SSR-safe remote modules (no DOM usage).
- For non-Astro providers, server manifests need `ssrRemoteEntry`; MF runtime will prefer that entry in Node/server execution.
- `mf-vite` still emits serve-time warnings around `plugin:add-entry` (`emitFile()` in serve mode).
