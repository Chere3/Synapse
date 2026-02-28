# Synapse - Legal Document Analysis Platform

![Synapse Banner](assets/Banner%20synapse.png)

Synapse is a full-stack legal-document analysis app powered by Next.js + Supabase + Cerebras.

## Features

- Secure authentication with Supabase
- Document upload and lifecycle tracking
- AI-assisted legal analysis pipeline
- Real-time status updates
- Responsive dashboard UI

## Stack

- Next.js (App Router)
- TypeScript
- Supabase (Auth + DB)
- Tailwind CSS
- pnpm

## Quick start

```bash
git clone https://github.com/Chere3/Synapse.git
cd Synapse
pnpm install
cp .env.example .env.local
pnpm run dev
```

Open `http://localhost:3000`.

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `CEREBRAS_API_KEY`

## Quality gates

```bash
pnpm run lint
pnpm run typecheck
pnpm run check
```

## Scripts

- `pnpm run dev` - Start local dev server
- `pnpm run build` - Create production build
- `pnpm run start` - Run production server
- `pnpm run lint` - Lint the project
- `pnpm run typecheck` - TypeScript validation
- `pnpm run check` - Combined baseline checks

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for planned improvements.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT
