# Kosh — Claude Code instructions

Single-fund, group-savings app for friends contributing a fixed amount each Nepali month. Members log in to view; admins/treasurers log in to manage. **Backend is Firebase (Auth + Firestore + Storage)** with real-time sync. Storage holds only payment-receipt attachments; rules live in [storage.rules](storage.rules).

## Run

```bash
npm install
npm run dev      # vite dev server on :5173
npm run build    # tsc -b && vite build → dist/
npm run lint
```

First-run setup is documented in [FIREBASE_SETUP.md](FIREBASE_SETUP.md). The default bootstrap admin is `admin@admin.com` (configurable via `VITE_BOOTSTRAP_ADMIN_EMAIL`).

## Architecture in 30 seconds

- **State** lives in [src/store/useAppStore.ts](src/store/useAppStore.ts) (Zustand). It holds the entire `AppData` snapshot (members, payments, investments, scalars) populated from a live Firestore subscription.
- **Persistence + sync** goes through [src/lib/storage.ts](src/lib/storage.ts) — a `DataStore` interface backed by Firestore. `subscribe()` wires four `onSnapshot` listeners (members, payments, investments, config) that push merged state into the store. Mutations write directly to per-collection docs.
- **Firebase init** is in [src/lib/firebase.ts](src/lib/firebase.ts). Main `auth` + `db` for the user's session; `secondaryAuth` is a parallel Auth instance used **only** when admin creates a new member — so admin's own session isn't blown away.
- **Auth** is in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx). On first login by the bootstrap admin email, the provider auto-creates that user's admin profile + the initial `config/fund` doc.
- **Permissions** in [src/lib/permissions.ts](src/lib/permissions.ts) are pure functions: `canManageMembers(role)`, `canManagePayments(role)`, etc. UI buttons hide based on these. Server-side enforcement is in [firestore.rules](firestore.rules).
- **Routing** is React Router v6, defined in [src/App.tsx](src/App.tsx). Pages live in [src/pages/](src/pages/).

## Firestore tree

```
members/{uid}                # uid = Firebase Auth UID; profile only (no password)
payments/{paymentId}         # random uuid IDs
investments/{investmentId}
loans/{loanId}               # loans to members or outside parties; annual simple interest
config/fund                  # single doc: cashInBank, monthlyContribution, lastUpdated
```

## Conventions

- TypeScript with `verbatimModuleSyntax` — always `import type` for types.
- No enums (TS `erasableSyntaxOnly` is on); use string literal unions.
- Mantine v7 for all UI primitives. Tabler icons for icons. Inter font.
- ApexCharts via `react-apexcharts`. Each chart reads `useComputedColorScheme()` and passes `theme.mode` + adaptive label colors so dark mode works.
- Mobile-first: `SimpleGrid cols={{ base, sm, lg }}`, tables in `Table.ScrollContainer`.
- Nepali calendar uses string labels like `"Ashoj 2082"`. Order is defined in [src/constants/months.ts](src/constants/months.ts).
- Accent text colors (positive/negative/info/accent) use CSS classes from [src/index.css](src/index.css), not hardcoded Mantine shades — they flip in dark mode via `--kosh-*` CSS variables.

## What to read first when debugging

- Calculations not matching: [src/lib/calculations.ts](src/lib/calculations.ts) — pure functions over `AppData`.
- Data not appearing: open Firebase Console → Firestore → Data; check the subscribe call in [src/lib/storage.ts](src/lib/storage.ts).
- "Missing or insufficient permissions" in console: check [firestore.rules](firestore.rules) is published and that the calling user's `members/{uid}` doc has the right role.
- Login fails for known-good password: check `VITE_FIREBASE_*` env vars in `.env.local`; the Firebase Console "Authorized domains" must include the host.

## Things that are intentionally NOT here

- localStorage data persistence (Firebase replaced it; only color scheme stays in localStorage via Mantine's manager)
- A password field on `Member` — Firebase Auth owns credentials; the form only sets the initial password when creating a new auth user
- Server-side code / Cloud Functions — admin-creates-user works via the secondary Auth pattern, no functions needed
