# Kosh — Group Savings & Investment Tracker

Mobile-first React app for tracking a group of friends pooling money each Nepali month into a shared fund. Records contributions, investments, and a Nepal-specific investment strategy. Real-time sync across devices via Firebase.

See [PROJECT.md](PROJECT.md) for full documentation, [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for first-time setup, and [CLAUDE.md](CLAUDE.md) for working notes.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

On first launch, click **Log in** and use the admin credentials you created in the Firebase Console (`admin@admin.com` by default). On successful login the app auto-creates your admin profile and the initial fund config doc.

## Build

```bash
npm run build    # output → dist/
npm run preview  # serve the build locally
```

## Deploy (Netlify)

Push to GitHub, connect the repo in Netlify, paste the `VITE_FIREBASE_*` and `VITE_BOOTSTRAP_ADMIN_EMAIL` values into Netlify's env settings. `netlify.toml` already configures the build and SPA redirect.

After deploy, add the Netlify domain to Firebase Console → Authentication → Authorized domains.

## Tech

React 19 · TypeScript · Vite · Mantine v7 · ApexCharts · Zustand · React Router v6 · Firebase (Auth + Firestore) · Inter font.

## Roles

| Role      | What they can do                                       |
|-----------|--------------------------------------------------------|
| Admin     | Everything: manage members, payments, investments      |
| Treasurer | Record payments and investments, update fund values    |
| Member    | View only                                              |
| Guest     | View only (no login)                                   |

UI hides forbidden controls; [firestore.rules](firestore.rules) enforces the same rules server-side.
