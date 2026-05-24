# Kosh — Group Savings & Investment Tracker

Mobile-first React app for a small group of friends pooling money each month into a shared fund ("Kosh", Nepali for "fund"). When enough cash accumulates, the group invests collectively — IPOs, fixed deposits, mutual funds. The app keeps everyone on the same page about who has contributed what, what's in the bank, what's been invested, and what to do next.

---

## Domain in plain English

- **6 members** (or more) each pay a fixed amount — currently Rs 2,000 — every Nepali month.
- The **treasurer** records each payment as it comes in.
- Once enough cash builds up, the group **invests collectively** (e.g., bought 100 units of SOHL via IPO at Rs 100/unit; now trading at Rs 691/unit).
- Members can log in to see exactly where they stand: how much they've paid, how much they owe, what the fund is worth, and what the group's strategy is for the next year.
- An **admin** manages member accounts; a **treasurer** records payments and investments; everyone else (including unauthenticated guests) can view everything.

---

## Tech stack

| Layer            | Choice                                 | Why                                                      |
|------------------|----------------------------------------|----------------------------------------------------------|
| Framework        | React 19 (Vite + TypeScript)           | Fast HMR, type safety, existing scaffold                 |
| UI               | Mantine v7 (`@mantine/core` + friends) | Mobile-friendly, accessible defaults, great form helpers |
| Charts           | ApexCharts (`react-apexcharts`)        | Donut, bar, area — clean defaults, responsive            |
| Routing          | `react-router-dom` v6                  | Standard SPA routing                                     |
| State            | Zustand                                | ~1KB, no boilerplate, easy migration story               |
| Persistence      | localStorage (today) → Firebase (next) | Abstracted via `DataStore` interface                     |
| Icons            | `@tabler/icons-react`                  | Matches Mantine aesthetics                               |
| Date input       | `@mantine/dates` + dayjs               | Used for payment dates only                              |
| Forms            | `@mantine/form`                        | Validation + reset built in                              |
| Notifications    | `@mantine/notifications`               | Toasts after CRUD actions                                |
| Modals           | `@mantine/modals`                      | Confirm dialogs without bespoke wiring                   |

---

## Features by page

### Dashboard (`/`)

Six KPI cards (responsive grid 2→3→6 columns):

- **Total fund value** — `cashInBank + Σ(units × currentRate)`
- **Cash in bank**
- **Invested amount** — total at buy rates
- **Invested (current)** — total at current rates
- **Gain** — overall percentage gain on investments
- **Pending dues** — Rs owed by all non-admin members across all recorded months

Plus:

- **Fund breakdown donut** — cash vs each investment, with total in the center
- **Monthly collection bar** — total collected per Nepali month
- **Recent payments** table (8 most recent by payment date)
- **Member contributions** table (per-member total, status badge)
- **Update fund values** card (cash + SOHL price) — visible only to admin/treasurer

### Members (`/members`)

Table columns: `# | Member | Username | Email | Contributed | Due | Status | Role | Actions`. Status is **Cleared** (green) or **Behind** (red); admin role is excluded from status calculations.

Admins (and only admins) see Add / Edit / Delete buttons. A member cannot delete their own account. Deleting a member also removes all of their payments.

The member form validates:

- Name (≥ 2 chars)
- Username (a–z, 0–9, _ . - only; ≥ 3 chars; unique)
- Email (regex)
- Role + Gender
- Password (≥ 6 chars; optional on edit)
- Confirm password (must match)

Avatar color is picked from a fixed palette by index.

### Contributions (`/contributions`)

Hand-built HTML table inside a `.sticky-table-wrap` container:

- First column (Month) is `position: sticky; left: 0`
- Header row is `position: sticky; top: 0`
- Footer (Grand total) is `position: sticky; bottom: 0`

This is read-only for everyone — to add data, use the Payments page.

### Payments (`/payments`)

Paginated list of payments sorted by payment date (most recent first). Add/Edit/Delete gated to admin or treasurer.

The form:

- Member (searchable Select, excludes admin role)
- Month (Nepali month) + Year (BS, defaults to Jestha 2083)
- Amount (defaults to `monthlyContribution = 2000`)
- Payment date (calendar AD date)

Duplicate detection: if a member already has a payment for the same `month/year`, the form shows an error and refuses to add.

### Investments (`/investments`)

Card grid (1 col on mobile, 2 on desktop). Each card shows:

- Name, type badge, status badge
- Invested amount (`units × buyRate`)
- Current amount (`units × currentRate`)
- Gain % (green if positive, red if negative)
- Buy date, maturity date, manager
- Description and notes

Admin/treasurer can add, edit, delete. Form auto-computes total buy/current amounts as you type.

### Strategy (`/strategy`)

Five tabs:

1. **Plan** — 4-tier allocation strategy (emergency reserve, FD, mutual fund SIP, IPO reserve)
2. **FD rates** — Current 1-year rates at major Nepal banks
3. **Mutual funds** — Top 5 funds ranked by 3-yr CAGR
4. **IPO pipeline** — Open / recently closed / upcoming IPOs in Nepal
5. **Projections** — Conservative + optimistic fund growth area chart, milestones, and "Today" KPI computed live

This content is static (sourced from external Nepal finance sites — sharegyannepal.com, Nepalytix, mystocknepal.com, sebon.gov.np) and intended as a reference. Update [src/components/strategy/strategyData.ts](src/components/strategy/strategyData.ts) when rates change.

---

## Data model

```ts
// src/types/index.ts
type Role = 'admin' | 'treasurer' | 'member';
type Gender = 'male' | 'female' | 'other';

interface Member  { id, name, username, password, email, gender, role, initials, color, fg, createdAt }
interface Payment { id, memberId, month, year, amount, paymentDate }
interface Investment {
  id, name, description, type, manager,
  buyDate, maturityDate,
  buyRate, currentRate, units,
  status, notes
}
interface AppData {
  members: Member[]
  payments: Payment[]
  investments: Investment[]
  cashInBank: number
  monthlyContribution: number
  lastUpdated: string
}
```

Storage key: `pfnk-data`. Auth key: `pfnk-current-user`.

---

## Role-based access control

|                      | admin | treasurer | member | guest |
|----------------------|:-----:|:---------:|:------:|:-----:|
| View everything      | ✓     | ✓         | ✓      | ✓     |
| CRUD members         | ✓     |           |        |       |
| CRUD payments        | ✓     | ✓         |        |       |
| CRUD investments     | ✓     | ✓         |        |       |
| Update fund values   | ✓     | ✓         |        |       |

Implemented as pure functions in [src/lib/permissions.ts](src/lib/permissions.ts). UI components call these and hide forbidden controls — there's no separate route guard because everything is viewable.

---

## Folder layout

```
src/
├── main.tsx, App.tsx, theme.ts, index.css
├── types/                # all TS interfaces
├── constants/            # months, roles, seed data, avatar palette
├── lib/                  # storage abstraction, calculations, formatters, permissions
├── store/                # Zustand store
├── contexts/             # AuthContext
├── components/
│   ├── common/           # MemberAvatar, RoleBadge, StatusBadge, LoginModal
│   ├── layout/           # AppLayout, NavLinks, UserMenu
│   ├── dashboard/        # KpiGrid, FundBreakdownChart, ContributionsBarChart, Recent*, Member*
│   ├── members/          # MembersTable, MemberFormModal
│   ├── contributions/    # ContributionsGrid
│   ├── payments/         # PaymentsList, PaymentFormModal
│   ├── investments/      # InvestmentsList, InvestmentCard, InvestmentFormModal
│   └── strategy/         # StrategyTabs + 5 tab components + strategyData.ts
└── pages/                # one page per route, composes feature components
```

---

## Security caveats (read before deploying publicly)

1. **Passwords are stored in plain text** inside `localStorage`. Anyone with browser DevTools access can read them. Acceptable only for a 6-person prototype where everyone trusts the device.
2. **No server-side authorization.** UI hides admin/treasurer controls based on role, but a determined user could edit `pfnk-current-user` in DevTools and unlock those controls. Trust is enforced socially, not technically.
3. **No data integrity guarantees.** Multiple users on different devices won't see each other's edits — local storage is per-device.

**Before sharing this app publicly,** you must migrate to Firebase (or another backend) so that:

- Authentication is server-verified
- Authorization is enforced server-side via Firestore security rules
- All members see the same data, in real time

The codebase is structured to make this migration mechanical — see CLAUDE.md.

---

## Firebase migration plan (when ready)

```
Firestore tree:
  kosh/{koshId}                    # root doc — cashInBank, monthlyContribution, lastUpdated
    members/{memberId}             # subcollection — name, username, email, gender, role, …
    payments/{paymentId}           # subcollection — memberId, month, year, amount, paymentDate
    investments/{investmentId}     # subcollection — name, type, units, buyRate, currentRate, …
```

Steps:

1. `npm install firebase`
2. Add `src/lib/firebase.ts` with `initializeApp` + Firestore instance.
3. Implement `FirebaseStore` next to `LocalStorageStore` in [src/lib/storage.ts](src/lib/storage.ts). Use `onSnapshot` to push live updates into the Zustand store.
4. Migrate `AuthContext` to use Firebase Auth. The `Member` table becomes a profile lookup; password fields disappear.
5. Write Firestore security rules:
   - Anyone can `read` everything.
   - Only authenticated users can `write`.
   - Only `request.auth.token.role == 'admin'` can write to `members/`.
   - Only `admin` or `treasurer` can write to `payments/` and `investments/`.
6. Delete the seed bootstrap in `useAppStore.hydrate()`; create the initial admin manually via Firebase console.

---

## Deployment (Netlify)

1. Push the repo to GitHub.
2. On Netlify: "Add new site → Import from Git → pick this repo".
3. Build command: `npm run build`. Publish directory: `dist`.
4. The `netlify.toml` at the repo root handles SPA fallback for React Router.
5. After Firebase migration, add Firebase config as environment variables (`VITE_FIREBASE_*`) in Netlify dashboard.

---

## Conventions to keep

- TypeScript everywhere. `verbatimModuleSyntax` + `erasableSyntaxOnly` are on, so always `import type` and never use enums (use string literal unions).
- All mutations go through the Zustand store, never directly through `storage`.
- Don't manually format Rs amounts — use `fmt()` from [src/lib/formatters.ts](src/lib/formatters.ts).
- Don't hardcode `2000` — use `data.monthlyContribution`.
- Don't compute member totals inline — use helpers from [src/lib/calculations.ts](src/lib/calculations.ts).
- Mobile-first: every new component must work at 375px wide.

---

## Future enhancements (not in scope today)

- Real AD ↔ BS conversion (currently the "current month" is hardcoded).
- Multi-fund support (one user belongs to multiple `kosh` groups).
- Audit log: who changed what, when (especially for payment deletes).
- Export to CSV / printable monthly statement.
- WhatsApp / Email reminders when dues are pending.
- Per-investment historic price chart.
- 2FA for treasurer/admin actions.
