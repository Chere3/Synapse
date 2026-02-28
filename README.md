# Synapse — Legal Document Analysis Platform

![Synapse Banner](assets/Banner%20synapse.png)

Synapse is a full-stack Next.js application for legal document analysis powered by Cerebras and Supabase.

## Core capabilities

- Secure authentication and per-user data access (Supabase)
- Document upload + extraction pipeline
- AI-based legal analysis workflows
- Real-time UX for analysis progress
- Searchable document and analysis history

## Tech stack

- Next.js 16 + React 19
- TypeScript
- Supabase (Auth + Database)
- Cerebras Cloud SDK
- Tailwind CSS

## Getting started

```bash
git clone https://github.com/Chere3/Synapse.git
cd Synapse
pnpm install
cp .env.example .env.local
pnpm run dev
```

Open http://localhost:3000.

## Environment variables

Use `.env.example` as reference:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CEREBRAS_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Scripts

- `pnpm run dev` — start dev server
- `pnpm run build` — production build
- `pnpm run start` — run production server
- `pnpm run lint` — lint codebase
- `pnpm run typecheck` — TypeScript checks
- `pnpm run check` — lint + typecheck

## Quality and CI

GitHub Actions run lint, typecheck, and build on pull requests and pushes to main branches.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
