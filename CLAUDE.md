# Kosh — Claude Code instructions

Single-fund, group-savings app for friends contributing a fixed amount each Nepali month. Members log in to view; admins/treasurers log in to manage.

## Run

```bash
npm install      # first time
npm run dev      # vite dev server on :5173
npm run build    # tsc -b && vite build → dist/
npm run lint
```

Default admin: `admin` / `admin123`.

## Architecture in 30 seconds

- **State** lives in [src/store/useAppStore.ts](src/store/useAppStore.ts) (Zustand). It owns the entire `AppData` object: members, payments, investments, cash-in-bank.
- **Persistence** goes through [src/lib/storage.ts](src/lib/storage.ts), which defines a `DataStore` interface. The current implementation is `LocalStorageStore` (key: `pfnk-data`). All mutations call `storage.save(data)` after updating in-memory state.
- **Auth** is in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx). The current user is just a member id stored under `pfnk-current-user`. Login matches `member.username` + `member.password` (plain text — prototype only).
- **Permissions** in [src/lib/permissions.ts](src/lib/permissions.ts) are pure functions: `canManageMembers(role)`, `canManagePayments(role)`, etc. UI buttons hide based on these.
- **Routing** is React Router v6, defined in [src/App.tsx](src/App.tsx). Pages live in [src/pages/](src/pages/), composed of feature-specific components under [src/components/](src/components/).

## When asked to "convert to Firebase"

1. Add `firebase` SDK + create `src/lib/firebase.ts` with the config.
2. Implement `FirebaseStore` next to `LocalStorageStore` in [src/lib/storage.ts](src/lib/storage.ts). Use Firestore collections: `kosh/{koshId}` doc holding scalar fields, plus subcollections `members`, `payments`, `investments`.
3. Swap the factory: `export const storage: DataStore = new FirebaseStore()`.
4. Replace [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) with Firebase Auth — keep the same `{ currentUser, login, logout }` API so callers don't change.
5. Drop password fields from the `Member` form once Firebase Auth owns credentials.

No UI/component changes are needed for the migration if the `DataStore` and `AuthContext` interfaces are preserved.

## Conventions

- TypeScript with `verbatimModuleSyntax` — always `import type` for types.
- No enums (TS `erasableSyntaxOnly` is on); use string literal unions.
- Mantine v7 for all UI primitives. Tabler icons for icons.
- ApexCharts via `react-apexcharts` for charts.
- Mobile-first: `SimpleGrid cols={{ base, sm, lg }}`, tables in `Table.ScrollContainer`.
- Nepali calendar uses string labels like `"Ashoj 2082"`. Order is defined in [src/constants/months.ts](src/constants/months.ts).

## What to read first when debugging

- Calculations not matching: [src/lib/calculations.ts](src/lib/calculations.ts) — pure functions, easy to unit-trace.
- Data not persisting: check `pfnk-data` in DevTools → Application → Local Storage.
- Permission button missing: check the role in `localStorage['pfnk-current-user']` against [src/lib/permissions.ts](src/lib/permissions.ts).
