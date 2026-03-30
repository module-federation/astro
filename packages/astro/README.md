# @module-federation/astro

Astro integration for Module Federation built on top of `@module-federation/vite`.

## Usage

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

Notes:

- `name@url` and plain URL remotes are normalized into explicit remote objects.
- `dts` defaults to `false` unless explicitly provided.
- With `dts: true`, `.astro` exposes are auto-wrapped for type generation, so users can expose `.astro` files directly.
- Host runtime auto-init is injected into Astro `page`.
- In `astro dev`, `ENV_TARGET` defaults to `undefined` so runtime infers browser vs node context.
- `mode: 'client' | 'server'` maps to MF target `'web' | 'node'` if you want to force one side.
- SSR `.astro` remote imports are transformed through an Astro SSR runtime path.

## `.astro` usage

Frontmatter (SSR-safe):

```astro
---
import { getRemoteServerMessage } from 'astro_remote/server';
const message = getRemoteServerMessage({ from: 'host-frontmatter' });
---
<p>{message}</p>
```

Client script:

```astro
<script>
  import { renderRemoteWidget } from 'astro_remote/widget';
  renderRemoteWidget(document.getElementById('widget'));
</script>
```
