# slang-intro

The intro/landing site for **Slang** — a customer communication platform (website chat, customer context, and team workflows in one workspace).

This is a short, single-page site: a hero, a quick "what Slang is" overview, and a Connect section with links to the WhatsApp channel, GitHub, LinkedIn, Instagram, and the team's contact emails.

## Stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing) on [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Nitro](https://nitro.build) for the server build/deploy target
- Icons from [lucide-react](https://lucide.dev)

## Develop

```bash
npm install
npm run dev
```

Runs the dev server (default port from Vite, printed on start).

## Build

```bash
npm run build
```

Type-check with `npx tsc --noEmit` if you want a standalone check without building.

## Deploy

The Nitro build target isn't hard-pinned — `vite.config.ts` sets `nitro: true`, so it auto-detects the right output for whichever platform runs the build (via `VERCEL` / `NETLIFY` env vars, set automatically by each platform's own build system):

- **Vercel**: `vercel.json` sets the build command; Vercel picks up the generated `.vercel/output` (Build Output API) automatically. No other config needed — just import the repo.
- **Netlify**: `netlify.toml` sets the build command and publish directory (`dist`); Netlify picks up the generated `.netlify/functions-internal` function for server rendering automatically.

Both work from this same repo with zero manual dashboard configuration beyond connecting it.
