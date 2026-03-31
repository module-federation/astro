# React federation example

Scenario:

- host Astro app consumes a federated React component
- host owns React setup explicitly with `@astrojs/react`
- federation handles the remote module loading only

Apps:

- host: `apps/react/host` -> `http://localhost:4331`
- remote: `apps/react/remote` -> `http://localhost:4332`

Run both:

```sh
pnpm dev:react
```
