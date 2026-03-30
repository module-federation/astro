---
title: Releasing
summary: Release flow for @module-federation/astro using Changesets and GitHub Actions trusted publishing.
read_when:
  - Preparing a release
  - Wiring npm publish automation
  - Updating release pipeline behavior
updated_at: 2026-03-30
---

# Releasing

This repo uses Changesets for versioning and publishes `@module-federation/astro` to npm via GitHub Actions trusted publishing.

## Flow

1. Add Changesets in feature PRs
   - `pnpm changeset`
2. Create + merge the release PR
   - GitHub Actions: `Release Pull Request`
3. Create a GitHub Release for the merge commit
   - Tag format: `<packages/astro/package.json version>` (example: `0.1.0`)
   - Stable: normal release
   - Pre-release: prerelease on the same base tag (example: `0.2.0`)
4. GitHub Actions publishes to npm
   - Workflow: `Publish (GitHub Release)` (`.github/workflows/publish-on-release.yml`)
   - Dist-tag:
     - Release trigger: `latest` for stable releases, `next` for prereleases
     - Manual trigger (`workflow_dispatch`): `latest` or `next`
   - Pre-release versioning:
     - On `prereleased` events, workflow patches `packages/astro/package.json` to `<base>-next.<N>` before publish.
   - Existing version handling:
     - If the exact version already exists on npm and already has the target dist-tag, publish is skipped.
     - If the version exists but the target dist-tag points elsewhere, workflow fails.
   - Uses npm trusted publishing (OIDC + provenance)

## Manual Publish

Use the `Publish (GitHub Release)` workflow with `Run workflow`:

- `version=latest`: publish current `branch` head with `latest`
- `version=next`: generate a snapshot version (`changeset version --snapshot`) and publish with `next`

## Notes

- Publish job hard-fails if `tag_name` does not match `packages/astro/package.json` version.
- Tags must not start with `v`.
- npm trusted publisher must be configured for:
  - repo: `module-federation/astro`
  - workflow: `.github/workflows/publish-on-release.yml`
  - environment: `Publish`
