# RepairHub — Frontend

Responsive web app for **RepairHub**, the trusted repair services marketplace
(TechCrush Capstone — Group 9, Frontend track). Built with **React + Vite + Tailwind CSS**,
talking to the [RepairHub backend API](../temp-repairhub).

## Features

- **Auth** — register as customer or technician, JWT session, role-based routing
- **Technician search** — category filter, text search, GPS "near me" with distance sorting
- **Repair requests** — category, description, photo uploads (Cloudinary signed direct upload,
  with URL fallback in mock mode), automatic location (GPS → address → IP)
- **Quotation comparison** — quotes sorted by price with technician ratings; accept & schedule
- **Booking & repair tracking** — live progress timeline (booked → in progress → completed →
  warranty → paid), job status updates with notes
- **Payments** — Paystack checkout (or built-in mock checkout) + verify, wallet credit
- **Wallet** — balance, transaction history, bank-account verification (Paystack resolve),
  withdrawals for technicians
- **Warranties** — digital warranty records with active/expired states
- **Reviews** — 1–5 star ratings with comments after completed repairs
- **Realtime notifications** — Socket.IO push + toast alerts + notification center
- **Technician workspace** — service profile (categories, service radius, ID document),
  available requests feed, quoting, job management, earnings
- **Admin panel** — verification queue (ID + bank-name cross-check), users, platform analytics

## Quick start

Start the backend first (from `../temp-repairhub`):

```bash
npm install
# in .env set USE_PG_MEM=true for a zero-setup in-memory database
npm start          # → http://localhost:4000
```

Then this frontend:

```bash
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:4000
npm run dev            # → http://localhost:5173
```

Seeded admin login: `admin@repairhub.ng` / `Admin123!`

## Demo walkthrough

1. Register a **technician** → set up service profile (categories, radius, ID) → log in as
   **admin** → approve them in *Verification*.
2. Register a **customer** → *New repair request* (photos, location).
3. As the technician → *Available jobs* → send a quotation.
4. As the customer → open the request → compare quotes → *Accept & book* (pick a time).
5. Technician → booking → *Start repair* → *Mark as completed* → *Issue warranty*.
6. Customer → booking → *Pay* (mock checkout) → *Confirm payment* → *Leave a review*.
7. Technician → *Wallet* → verify bank account → withdraw earnings.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | react-router-dom |
| HTTP | axios (JWT interceptor) |
| Realtime | socket.io-client |
| Icons / toasts | lucide-react, react-hot-toast |

## Deployment (Render)

Live: <https://temp-repairhubfrontend.onrender.com>

| Setting | Value |
|---|---|
| Type | Static Site |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Env vars | every `VITE_*` key from `.env.example` (Vite inlines these at **build** time — changing one requires a redeploy, not just a restart) |

### The SPA rewrite rule is required

This app uses `BrowserRouter`, so `/login`, `/dashboard`, `/admin/technicians` etc. exist
only in the client-side router — there is no file at those paths in `dist`. A static host
asked for one returns its own 404, so **the landing page works but refreshing or deep-linking
any other page returns "Not Found"** until an unmatched-path rewrite is configured:

| Field | Value |
|---|---|
| Source | `/*` |
| Destination | `/index.html` |
| Action | **Rewrite** |

Two things matter here:

- It must be **Rewrite**, not Redirect. A redirect changes the URL in the address bar, which
  defeats deep links and breaks the 401 hard-redirect in `src/api/client.js`.
- Keep it as the **last** rule, since rules are evaluated top-down.

Real files still win over the rewrite, so `/assets/*` and `/firebase-messaging-sw.js`
keep serving normally.

**Where to configure it.** `render.yaml` in this repo declares the rule, but Render only reads
that file for **Blueprint-managed** services. The live site was created manually via
*New → Static Site*, so `render.yaml` is ignored and the rule must be set in the dashboard:

> Render dashboard → the static site → **Redirects/Rewrites** → **Add Rule** → fill in the
> table above → Save.

If the service is ever recreated, set this rule again — it is the single most common cause of
a "works on the landing page, 404s everywhere else" report. To make `render.yaml` authoritative
instead, attach the repo as a Blueprint; note the service name in `render.yaml` must match the
existing service or the sync creates a second one alongside it.

## Project structure

```text
src/
  main.jsx                 App bootstrap (router, providers, toaster)
  App.jsx                  Route table with role-guarded sections
  api/client.js            Axios instance + auth interceptor
  lib/format.js            Naira/date formatting, status styles
  context/AuthContext.jsx  JWT session state
  context/NotificationContext.jsx  Socket.IO + notification store
  components/              Layout, route guard, UI primitives, PhotoUploader
  pages/                   Public, shared, customer/, technician/, admin/ pages
```
