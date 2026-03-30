---
title: Vite Module Federation Internals
summary: Practical architecture notes from mf-vite internals for implementing and debugging @module-federation/astro.
read_when:
  - Implementing Astro MF integration
  - Debugging remote import rewrite issues
source:
  - /Users/nsttt/work/mf-vite/src
  - /Users/nsttt/work/mf-vite/docs/architecture
updated_at: 2026-03-05
---

# Vite Module Federation Internals

Primary source files:

- `/Users/nsttt/work/mf-vite/src/index.ts`
- `/Users/nsttt/work/mf-vite/docs/architecture/overview.md`
- `/Users/nsttt/work/mf-vite/docs/architecture/remote-module-loading.md`
- `/Users/nsttt/work/mf-vite/docs/architecture/entry-injection.md`

## Pipeline Summary

`federation(options)` returns many Vite plugins (composed pipeline). Key stages:

1. Early virtual module infra creation (`node_modules/__mf__virtual`).
2. Alias/proxy setup for shared modules + remotes.
3. Entry chunk emission (`remoteEntry`, `hostInit`, `virtualExposes`).
4. Remote import rewrite to `runtime.loadRemote(...)`.
5. Shared import rewrite to `runtime.loadShare(...)`.
6. Manifest generation (`mf-manifest.json`).

## Critical Internal Concepts

- Virtual modules are written to disk (not only in-memory) to survive optimizeDeps behavior.
- `hostInit` injects runtime bootstrap very early.
- Remote usage is tracked (`addUsedRemote`) and reflected into manifest/runtime maps.
- Dev and build paths diverge (CJS placeholders + TLA handling in dev, Rollup chunk flow in build).

## Remote Import Rewrite Behavior

`import('remote/Widget')` does not stay as-is.
It is rewritten into a generated module that calls federation runtime:

- waits for init
- resolves remote entry
- calls `loadRemote('remote/Widget')`

Implication for Astro:

- The import must pass through Vite transform pipeline.
- Raw inline HTML script output (unprocessed) will fail with bare-specifier browser errors.

## Integration Rules for Astro Package

Keep these defaults in `@module-federation/astro`:

- Ensure Vite plugin always installed through Astro integration hook.
- Prefer `dts: false` default for PoC/dev reliability.
- Normalize core-style remote strings (`name@url`) into Vite-expected remote values.
- Keep host runtime dependencies available in optimizeDeps/SSR noExternal when needed.

## Known Warnings Seen in PoC

- `plugin:add-entry ... emitFile() is not supported in serve mode`
- `@module-federation/sdk ... Use of eval ... discouraged`

Observed impact in PoC:

- non-fatal for build/dev in current workspace.
- keep documented; monitor upstream in `mf-vite`.
