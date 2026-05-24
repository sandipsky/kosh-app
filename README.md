# Kosh — Group Savings & Investment Tracker

Mobile-first React app for tracking a group of friends pooling money each Nepali month into a shared fund. Records contributions, investments, and a Nepal-specific investment strategy.

See [PROJECT.md](PROJECT.md) for full documentation and [CLAUDE.md](CLAUDE.md) for working notes.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Default login: `admin` / `admin123`.

## Build

```bash
npm run build    # output → dist/
npm run preview  # serve the build locally
```

## Deploy (Netlify)

Push to GitHub, connect the repo in Netlify. `netlify.toml` already configures the build (`npm run build`, publish `dist/`) and the SPA redirect for React Router.

## Tech

React 19 · TypeScript · Vite · Mantine v7 · ApexCharts · Zustand · React Router v6 · localStorage (Firebase migration documented in [CLAUDE.md](CLAUDE.md)).

## Roles

| Role      | What they can do                                       |
|-----------|--------------------------------------------------------|
| Admin     | Everything: manage members, payments, investments      |
| Treasurer | Record payments and investments, update fund values    |
| Member    | View only                                              |
| Guest     | View only (no login)                                   |
