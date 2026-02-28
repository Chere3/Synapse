# Synapse — AI Contract Analysis Platform

![Synapse Banner](assets/banner-readme.png)

Synapse is a full-stack legal-tech app that helps teams analyze contracts faster with AI. Upload a document, extract key clauses, score risk levels, and get actionable explanations in a modern Material Design 3 interface.

## Why Synapse

- **Faster legal review** with AI-assisted analysis
- **Clause-level risk scoring** with clear explanations
- **Document + chat workflow** in one place
- **Secure auth and data isolation** with Supabase RLS
- **Premium UX** built with Next.js, React, TypeScript, and Tailwind

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + Material Design 3 token system
- **Auth & DB:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **AI:** Cerebras Cloud SDK
- **Document parsing / OCR:** `pdfjs-dist`, `tesseract.js`
- **UI libs:** `lucide-react`, Radix Progress, `react-toastify`

---

## Project Structure

```text
app/
  api/
    analyze/route.ts      # contract analysis endpoint
    chat/route.ts         # chat endpoint
  auth/
    page.tsx              # auth screen
    callback/route.ts     # auth callback
  dashboard/page.tsx      # main app dashboard
  page.tsx                # marketing landing page
  globals.css             # global styles + M3 tokens

components/
  analysis-results.tsx
  chat-interface.tsx
  document-list.tsx
  document-upload.tsx
  hero-demo-mockup.tsx
  auth-redirect.tsx

supabase/
  migrations/             # DB schema and storage setup
```

---

## Getting Started

### 1) Prerequisites

- Node.js **22+** recommended
- `pnpm` (project uses `pnpm@10` lockfile)
- Supabase project
- Cerebras API key

### 2) Clone

```bash
git clone https://github.com/Chere3/Synapse.git
cd Synapse
```

### 3) Install dependencies

```bash
pnpm install
```

### 4) Configure environment

Copy the example file and fill values:

```bash
cp .env.local.example .env.local
```

Required vars:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cerebras (required, server-side only)
CEREBRAS_API_KEY=

# Optional app URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5) Run database migrations

Use your preferred Supabase workflow to apply files in `supabase/migrations`:

- `20240101000000_create_documents.sql`
- `20240101000001_create_storage.sql`
- `20240101000002_add_extracted_text.sql`
- `20240101000003_create_analysis.sql`

---

## Local Development

```bash
pnpm dev
```

Open: <http://localhost:3000>

---

## Scripts

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # start production server
pnpm lint     # lint project
```

---

## Deployment Notes

- Set all environment variables in your hosting platform.
- Ensure Supabase auth callback URLs include your deployed domain.
- Run `pnpm build` in CI before deployment.

---

## Contributing

1. Create a feature branch
2. Make focused changes
3. Run checks (`pnpm lint`, `pnpm build`)
4. Open a pull request with clear verification steps

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Built by Cheree Team</sub>
</div>
