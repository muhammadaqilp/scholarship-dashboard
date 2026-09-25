# Scholarship Quest

Offline-first scholarship matching app. The Excel workbook in `data/source/` is
the source of truth for scholarship data; matching runs entirely in the
browser with no AI/search calls. See `AGENTS.md` for Next.js version notes.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run dev` and `npm run build`
both regenerate `data/generated/*.json` from the Excel file and the access
code hash automatically (see `predev`/`prebuild` in `package.json`).

## Configuration

Both are set via `.env.local` (gitignored, never committed - copy
`.env.local.example` to start). Changing either only requires editing the
one value and rebuilding; nothing else in the codebase references them.

| Variable | Purpose |
| --- | --- |
| `SCHOLARSHIP_QUEST_ACCESS_CODE` | The one static access code customers use to unlock the app after purchase. Only its SHA-256 hash is baked into the client bundle - the plaintext code is never shipped to the browser. If unset, a placeholder dev code (`SQ-2026-DEMO`) is used and a `.env.local` is auto-created with it on first build. |
| `NEXT_PUBLIC_PURCHASE_URL` | Optional link shown on the access screen ("Beli akses Scholarship Quest dulu, ya") for customers who don't have a code yet. If unset, that line renders as plain text with no link. |

The access gate is a client-side check, not real authentication - see the
comment at the top of `src/components/AccessGate.tsx` for the honest
tradeoff. Its job is to stop casual access and give paying customers a clean
unlock experience, not to run a license-management platform.

## Updating scholarship data

Replace `data/source/scholarship-calendar.xlsx` with a new export from the
same "Full Database" sheet layout, then run `npm run data:build` (or just
`npm run dev` / `npm run build`, which do it automatically).

## Deploying

Deploys cleanly to [Vercel](https://vercel.com/new) - it auto-detects Next.js.
Set both env vars above in the Vercel project's Environment Variables before
the first deploy.
