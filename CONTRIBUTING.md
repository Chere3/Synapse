# Contributing

Thanks for contributing to Synapse.

## Workflow

1. Create a branch from `dev` using conventional prefixes:
   - `feat/*` for features
   - `fix/*` for bug fixes
   - `chore/*` for tooling/docs/infra
2. Keep PRs focused and easy to review.
3. Use [Conventional Commits](https://www.conventionalcommits.org/).

## Local validation

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run check
```

## Pull Request checklist

- [ ] Lint and typecheck pass locally
- [ ] Docs updated when behavior/setup changed
- [ ] Environment variables documented in `.env.example`
- [ ] PR description includes scope, risk, and validation steps
