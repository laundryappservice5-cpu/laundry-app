# The Royal Fresh Laundry — Management System

A full-stack laundry management system: an admin web dashboard, a driver mobile app, and a Node/Express/MongoDB backend.

## Structure

```
backend/   Node + Express + TypeScript + MongoDB API
web/       React admin dashboard (Vite + MUI + Redux Toolkit)
app/       Expo/React Native driver mobile app
```

Each folder is independently runnable and has its own `package.json`, `.env.example`, and README-level setup notes below.

## Prerequisites

- Node.js 20+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- (Driver app) [Expo Go](https://expo.dev/go) on your phone, or Android Studio for local builds

## Backend setup

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, etc.
npm install
npm run dev             # http://localhost:4000
```

Seed the root admin and default catalog (cloth types/services):

```bash
npm run seed:root-admin
npm run seed:defaults
```

## Web admin dashboard setup

```bash
cd web
cp .env.example .env   # set VITE_API_BASE_URL
npm install
npm run dev              # http://localhost:5173
```

## Driver app setup

```bash
cd app
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL to your machine's LAN IP
npm install
npx expo start
```

## Environment variables

No secrets are committed to this repository. Every service reads its configuration from a local `.env` file (gitignored) — see each folder's `.env.example` for the full list of variables it needs.

## Deployment

- **Backend**: deployed on Render (free web service tier).
- **Web dashboard**: deployed on GitHub Pages.
- **Driver app**: built as an installable Android APK via Expo EAS Build.

See `DEPLOYMENT.md` for step-by-step production setup notes.
