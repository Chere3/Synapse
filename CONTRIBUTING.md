# Contributing to Synapse

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase project (or local stack)
- Cerebras API key

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

## Quality checks

Before opening a PR, run:

```bash
pnpm run check
pnpm run build
```

## Branch and commit conventions

- Branches: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `refactor/<topic>`
- Commits: Conventional commits (`feat:`, `fix:`, `chore:`)

## Pull request checklist

- [ ] Purpose and scope explained
- [ ] Verification steps included
- [ ] Screenshots added for UI changes
- [ ] Env var changes reflected in `.env.example` and README
