# Kosh — Group Savings & Investment Tracker

Mobile-first React app for a small group of friends pooling money each month into a shared fund ("Kosh", Nepali for "fund"). When enough cash accumulates, the group invests collectively — IPOs, fixed deposits, mutual funds. The app keeps everyone on the same page about who has contributed what, what's in the bank, what's been invested, and what to do next.

**Backend:** Firebase (Authentication + Firestore) — real-time sync across all members' devices.

For first-time setup, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

---

## Domain in plain English

- **6 members** (or more) each pay a fixed amount — currently Rs 2,000 — every Nepali month.
- The **treasurer** records each payment as it comes in.
- Once enough cash builds up, the group **invests collectively** (e.g., bought 100 units of SOHL via IPO at Rs 100/unit; now trading at Rs 691/unit).
- Members can log in to see exactly where they stand: how much they've paid, how much they owe, what the fund is worth, and what the group's strategy is for the next year.
- An **admin** manages member accounts; a **treasurer** records payments and investments; everyone else (including unauthenticated guests) can view everything.

---

## Tech stack

| Layer            | Choice                                 | Why                                                         |
|------------------|----------------------------------------|-------------------------------------------------------------|
| Framework        | React 19 (Vite + TypeScript)           | Fast HMR, type safety                                       |
| UI               | Mantine v7 (`@mantine/core` + friends) | Mobile-friendly, accessible defaults, great form helpers    |
| Font             | Inter (Google Fonts)                   | Modern, optimized for UI, tabular numerals for amounts      |
| Charts           | ApexCharts (`react-apexcharts`)        | Donut, bar, area — clean, responsive, dark-mode adaptive    |
| Routing          | `react-router-dom` v6                  | Standard SPA routing                                        |
| State            | Zustand                                | ~1KB, no boilerplate, populated from Firestore subscription |
| Auth             | Firebase Auth (Email/Password)         | Free tier; trusted across all member devices                |
| Database         | Cloud Firestore                        | Real-time `onSnapshot` listeners → instant cross-device sync|
| Icons            | `@tabler/icons-react`                  | Matches Mantine aesthetics                                  |
| Date input       | `@mantine/dates` + dayjs               | Payment date picker                                         |
| Forms            | `@mantine/form`                        | Validation + reset built in                                 |
| Notifications    | `@mantine/notifications`               | Toasts after CRUD actions                                   |
| Modals           | `@mantine/modals`                      | Confirm dialogs without bespoke wiring                      |

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

- **Fund breakdown donut** — cash vs each investment, total in center
- **Monthly collection bar** — total collected per Nepali month
- **Recent payments** table (8 most recent by payment date)
- **Member contributions** — name, contributed, share %, fund value, status
- **Update fund values** card (cash + SOHL price) — admin/treasurer only

### Members (`/members`)

Table: `# | Member | Username | Email | Contributed | Due | Status | Role | Actions`.

Admins (and only admins) see Add / Edit / Delete buttons. A member cannot delete their own account. Deleting a member also removes all of their payments.

**Add member**: admin enters name + username + email + role + gender + initial password + confirm. The app creates a Firebase Auth user (via the secondary auth instance so admin's session is preserved) and writes the profile doc to `members/{uid}`. Tell the new member their initial password; they can change it via "Forgot password?" on the login screen.

**Edit member**: admin can update name, username, role, gender. Email is locked (it's the Auth identifier). A "Send password reset email" button sends a Firebase reset link to the member.

### Contributions (`/contributions`)

Hand-built HTML table with sticky first column (Month), sticky header row, and sticky footer (Grand total). Read-only for all roles.

### Payments (`/payments`)

Paginated list sorted by payment date. Admin/treasurer can add or delete.

The form: Member (excludes admin role) → Month + Year (BS) → Amount → Payment date. Duplicate detection: a member can only have one payment per `month/year`.

### Investments (`/investments`)

Card grid. Admin/treasurer can add/edit/delete. Form auto-computes total buy/current amounts and shows gain %.

### Strategy (`/strategy`)

Five tabs of Nepal-specific reference content (Plan tiers, FD rates, top mutual funds, IPO pipeline, projections). Projections chart is live (uses current fund total).

---

## Data model

```ts
// src/types/index.ts
type Role = 'admin' | 'treasurer' | 'member';
type Gender = 'male' | 'female' | 'other';

interface Member  { id (= auth uid), name, username, email, gender, role, initials, color, fg, createdAt }
interface Payment { id, memberId, month, year, amount, paymentDate }
interface Investment {
  id, name, description, type, manager,
  buyDate, maturityDate,
  buyRate, currentRate, units,
  status, notes
}
```

`Member` no longer has a `password` field — Firebase Auth owns credentials.

## Firestore tree

```
members/{uid}              # uid = Firebase Auth UID
payments/{paymentId}       # paymentId = uuid
investments/{investmentId} # investmentId = uuid
config/fund                # single doc: cashInBank, monthlyContribution, lastUpdated
```

Real-time updates: [src/lib/storage.ts](src/lib/storage.ts) sets up four `onSnapshot` listeners that push merged state into the Zustand store. Mutations write to per-collection docs directly; the listener echoes them back.

---

## Role-based access control

|                      | admin | treasurer | member | guest |
|----------------------|:-----:|:---------:|:------:|:-----:|
| View everything      | ✓     | ✓         | ✓      | ✓     |
| CRUD members         | ✓     |           |        |       |
| CRUD payments        | ✓     | ✓         |        |       |
| CRUD investments     | ✓     | ✓         |        |       |
| Update fund values   | ✓     | ✓         |        |       |

Enforced in two places:

- **UI** — pure functions in [src/lib/permissions.ts](src/lib/permissions.ts) hide forbidden controls
- **Server** — [firestore.rules](firestore.rules) gates every read/write against the user's `members/{uid}` profile doc

---

## Folder layout

```
src/
├── main.tsx, App.tsx, theme.ts, index.css
├── types/                # all TS interfaces
├── constants/            # months, roles, avatar palette
├── lib/
│   ├── firebase.ts       # init main + secondary auth + Firestore w/ persistent cache
│   ├── storage.ts        # DataStore impl (subscribe + granular writes)
│   ├── calculations.ts   # pure derivations from AppData
│   ├── formatters.ts
│   └── permissions.ts
├── store/useAppStore.ts  # Zustand store, hydrate() subscribes to Firestore
├── contexts/             # AuthContext (Firebase Auth + bootstrap)
├── hooks/useAuth.ts
├── components/
│   ├── common/           # MemberAvatar, RoleBadge, StatusBadge, LoginModal
│   ├── layout/           # AppLayout, NavLinks, UserMenu, ColorSchemeToggle
│   ├── dashboard/        # KpiGrid + 5 visual sections
│   ├── members/          # MembersTable, MemberFormModal
│   ├── contributions/    # ContributionsGrid (sticky)
│   ├── payments/         # PaymentsList, PaymentFormModal
│   ├── investments/      # InvestmentsList, InvestmentCard, InvestmentFormModal
│   └── strategy/         # StrategyTabs + 5 tabs + strategyData.ts
└── pages/                # one per route
```

---

## Security notes

The Firebase **API key is not a secret** — it's a public client identifier. All real security comes from [firestore.rules](firestore.rules), enforced server-side.

The rules use a one-time bootstrap clause: the email in `VITE_BOOTSTRAP_ADMIN_EMAIL` can self-create its own admin profile on first login. After you have at least one admin in Firestore, you may remove the bootstrap clause from the rules.

**Before sharing publicly:** add your Netlify domain to Firebase Console → Authentication → Authorized domains. Consider enabling App Check.

---

## Deployment (Netlify)

1. Push to GitHub
2. Netlify → "New site from Git" → pick repo
3. Build command: `npm run build` · Publish: `dist`
4. Netlify dashboard → Environment variables → paste every `VITE_FIREBASE_*` and `VITE_BOOTSTRAP_ADMIN_EMAIL` value
5. Deploy
6. Add the deployed domain to Firebase Console → Authentication → Authorized domains

The `netlify.toml` at the repo root handles the SPA fallback for React Router.

---

## Conventions to keep

- TypeScript everywhere. `verbatimModuleSyntax` + `erasableSyntaxOnly` are on — always `import type` and never use enums.
- All mutations go through the Zustand store, never directly through `storage`.
- Don't manually format Rs amounts — use `fmt()` from [src/lib/formatters.ts](src/lib/formatters.ts).
- Don't hardcode `2000` — use `data.monthlyContribution`.
- Use the adaptive CSS classes (`.text-positive`, `.text-negative`, `.text-info`, `.text-accent`, `.num`) for accent text — never `c="teal.8"` style shades, those don't flip in dark mode.
- Mobile-first: every new component must work at 375px wide.

---

## Future enhancements (not in scope today)

- Real AD ↔ BS conversion (currently the "current month" is a constant)
- Multi-fund support (a user belongs to multiple `kosh` groups)
- Audit log (who changed what, when)
- Export to CSV / printable monthly statement
- Email/WhatsApp reminders when dues are pending
- Per-investment historic price chart
- Cloud Function to admin-create users (cleaner than the secondary-auth pattern, but Spark-plan-compatible alternative works fine)
