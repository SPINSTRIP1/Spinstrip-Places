# SpinStrip Places (consumer storefront)

The public-facing web app where customers discover what merchants have listed on
SpinStrip and pay for it. It has three sections:

- **Places**: hotels, venues, clinics, gyms and similar spots. Customers can book a facility.
- **Events**: customers can register for an event or buy tickets.
- **Restaurants (Smart Menu)**: customers browse a kitchen's menu, build a cart, pay, and then
  follow the order live. Once paid, they can chat with or ping a waiter, tip, rate the order and play games while they wait.

This repository is **frontend only**. It has no database and stores no secrets. All data
and payments go through the SpinStrip backend services listed under
[Dependencies](#dependencies-on-other-services).

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix), SF Pro (self-hosted in `public/fonts`) |
| Data | TanStack Query v5 over axios; Socket.IO client for live order updates |
| Forms | react-hook-form + zod |
| Repository | `github.com/SPINSTRIP1/Spinstrip-Places` |

---

## Responsibility

**This service is responsible for:**

- Listing published places, events and menu items, with search, filters, sorting and pagination
  (filtering and sorting happen on the server).
- Detail pages for places, events and dishes, and the checkout flows for each.
- Sending customers to the payment provider and checking the payment when they return.
- Showing each restaurant as its own storefront. This is built from menu data (see
  [How restaurants are built](#how-restaurants-are-built)).
- The guest's view of a menu order: receipt QR code, live status, chat with the waiter, ping,
  tip and rating.
- Features that exist only in the browser: the table number from a scanned QR code, the
  diner's nickname, sending a cart to the table captain, games and a leaderboard, and an
  "orders on this phone" list.

**It is not responsible for:**

- Merchant onboarding or listing management. That happens in the merchant dashboard.
- The waiter-side app (accepting and releasing orders, replying to chat).
- Authentication. The storefront has no login. Guests are identified by the email they
  enter at checkout. Some "log in" links point to `/login`, which this app does not
  provide (see [Known issues](#known-issues--limitations)).
- Payment processing, receipts and emails. The backend handles these.

**Owner:** _TODO: team or person accountable, and the support contact._

---

## Getting started

### Prerequisites

- **Node.js 20.9 or later.** Next.js 16 requires it. The app is developed on Node 22.
- npm (the repository commits `package-lock.json`, so use `npm ci` in CI).

### Run locally

```bash
npm install
cp .env.example .env.local      # then fill in values, see below
npm run dev                     # http://localhost:3001
```

The dev server runs on **port 3001**, not 3000. This leaves 3000 free for the other
SpinStrip frontends. Next.js will not start a second dev server for the same project.

Local development calls the **live** SpinStrip backends. Nothing needs to run locally
besides this app.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3001 |
| `npm run build` | Production build into `.next/` |
| `npm run start` | Serves the production build (port 3000 by default; use `-p` or `PORT` to change it) |
| `npm run lint` | ESLint (`eslint-config-next` core-web-vitals + typescript, flat config) |
| `npx tsc --noEmit` | Type-check. The build does **not** type-check, see [Configuration](#configuration) |

There is no test suite.

---

## Environment variables

Only `NEXT_PUBLIC_*` variables are read. Next.js **inlines them into the browser bundle at
build time**, so:

- every value is public. Never put a secret in one;
- changing a value requires a **rebuild**, not just a restart.

| Variable | Required | Used by | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes in production | [src/app/layout.tsx](src/app/layout.tsx) | Public origin of the deployment, e.g. `https://places.spinstrip.com`. Set as `metadataBase` so Open Graph and Twitter image URLs are absolute. Falls back to `http://localhost:3000`, which gives broken social previews in production. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes, for maps | [src/app/preview/places/page.tsx](src/app/preview/places/page.tsx), [src/app/preview/events/page.tsx](src/app/preview/events/page.tsx) | Google Maps **Embed API** key for the location iframe on place and event detail pages. If it is missing, the map shows a Google error and the rest of the page still works. |

The backend URLs are **not** environment variables. They are hard-coded in
[src/constants/index.ts](src/constants/index.ts) (see below).

### Service and API keys

| Key | Where to get it | Notes |
|---|---|---|
| Google Maps Embed API key | Google Cloud Console → APIs & Services → enable **Maps Embed API** → Credentials | The key ships to the browser. **Restrict it** to the Maps Embed API and to HTTP referrers for your domains (and `localhost:3001` for development). The Embed API has no usage charge, but the key still needs a project with billing enabled. |

No other keys are needed. Paystack and Fuspay credentials, and any service-to-service
tokens, belong to the backend services. Public endpoints need no auth header.

---

## Dependencies on other services

All base URLs live in [src/constants/index.ts](src/constants/index.ts):

| Constant | Host | Used for |
|---|---|---|
| `SERVER_URL` | `https://spinstrip-merchant-gateway.fly.dev/api/v1` | Default axios base URL; place and event detail (`/places/public/:id`, `/places/:id/facilities`, `/events/public/:id`); **Socket.IO gateway** for menu realtime |
| `PLACES_API_URL` | `https://spinstrip-places.fly.dev/api/v1` | Place listing (`GET /places/public`), booking (`POST /places/public/book`), payment verification (`GET /places/payments/verify/:reference`) |
| `USER_ACCOUNT_URL` | `https://spinstrip-user-account.fly.dev/api/v1` | Event listing (`GET /events/public`) |
| `EVENTS_SERVER_URL` | `https://spinstrip-events.fly.dev/api/v1` | Event registration and ticketing (`POST /events/public/:id/register`), payment verification (`GET /events/payments/verify/:reference`) |
| `MENU_API_URL` | `https://spinstrip-menu.fly.dev/api/v1` | Menu items (`GET /menu/public/menu-items`), orders (`POST/GET /menu/public/orders`, `GET /menu/public/orders/:id`), chat, ping, rating and tips (`/menu/public/orders/:id/{messages,ping,rating,tips}`), payment and tip verification (`GET /menu/payments/verify/:reference`) |
| `MENU_REALTIME_ORIGIN` + `MENU_REALTIME_PATH` | gateway origin + `/api/v1/menu/realtime` | Socket.IO connection for live order events. Connect to the **gateway**, not the menu host. The gateway forwards this path to the menu service. |

Other external dependencies:

| Service | Purpose |
|---|---|
| Paystack, Fuspay (`LEDGER_BLOCK` for menu and places, `PAYONUS` for events) | The backend creates the payment and returns an `authorizationUrl`. The browser goes to that URL. The provider sends the customer back to the `callbackUrl` the app passed, adding `?reference=` (or `trxref`). |
| DigitalOcean Spaces (`spin-strip.sfo3.digitaloceanspaces.com`) | Merchant-uploaded images, served through `next/image`. This is the only remote image host allowed in [next.config.ts](next.config.ts). |
| Google Maps Embed | Location iframe on detail pages. |

### Backend behaviour to be aware of

- **The Fly.io services go to sleep when idle.** The first requests after a quiet period can
  time out or return HTTP 500 while a machine starts up. Treat that as a cold start, not a
  frontend bug.
- **Validation only accepts known fields.** Sending an unknown body field gets a rejection
  like `property X should not exist`. Send only fields the API documents.
- The `placeType` filter accepts only the server's enum (anything else returns 400). The menu `category` filter is
  **case-sensitive**. A `userId` that is not a UUID returns 400.
- `/menu/public/menu-items` caps `limit` at 100. The app requests `PAGE_SIZE = 12`.

### How restaurants are built

The menu service has **no restaurant or merchant endpoint**. Each dish carries only its
merchant's `userId`. [src/hooks/use-restaurants.ts](src/hooks/use-restaurants.ts) groups
public menu items by `userId`, then matches each group to the `GET /places/public` record with the same
`userId` to get the name, logo, address and opening hours. A merchant with no published place
gets a generated name, "Kitchen XXXX". The route `/restaurants/:id` uses the merchant
`userId` as `id`. This approach should be replaced once the backend exposes a merchant profile.

### Menu realtime contract

Guests open a Socket.IO connection with `auth: { orderId, email }`. A wrong email causes an
immediate server disconnect. Socket.IO does not reconnect automatically after a server
disconnect. Guests receive `order.accepted`, `order.released`, `order.message`, `order.tipped`
and `order.rated`. Each event makes the app fetch the order (and chat thread) again. The event
payload is not trusted on its own.

- `waiterAssignment` (`UNASSIGNED` / `ACCEPTED`) is the only reliable signal of waiter state.
- After a waiter **releases** an order, the API rejects chat, ping, tip and rating with "No
  waiter is processing this order".
- A second ping within 60 seconds returns 429.

---

## Routes

| Route | Rendering | Description |
|---|---|---|
| `/` | Static shell, client data | Home: Places / Events / Restaurants tabs, search, category chips, sort, pagination |
| `/preview/places?id=` | Static shell, client data | Place detail and facility booking checkout |
| `/preview/places/success?reference=` | Static shell | Payment return page that verifies a place booking |
| `/preview/events?id=` | Static shell, client data | Event detail and ticket checkout |
| `/preview/events/success?reference=` | Static shell | Payment return page that verifies an event ticket |
| `/preview/menu?id=&merchant=` | Static shell, client data | Single dish detail and checkout |
| `/preview/menu/success?reference=` | Static shell | Payment return page that verifies a menu order, then opens the order page |
| `/restaurants/:merchantUserId` | Dynamic | Restaurant storefront and cart. `?number=7` (or `table` / `t`) sets the table from a QR code; `?item=` opens a dish |
| `/orders` | Static | Orders placed from this browser |
| `/orders/:id` | Dynamic | Order page: receipt QR, live status, waiter panel, games. `?tip=1&reference=` settles a tip |
| `/games/:game` | Dynamic | `jigsaw`, `tiles`, `spinanza`, `leaderboard`; reads `?r=<merchant>&t=<table>&order=<id>` |

The **payment return URLs are built from `window.location.origin`**. Customers come back to
whichever domain they paid from.

### State kept in the browser

There is no login, so these features use `localStorage`. All keys are prefixed `spinstrip:`
(see [src/lib/smart-menu.ts](src/lib/smart-menu.ts)):

- table number per merchant, diner nickname, cart per merchant, cart transfer tags
- order snapshots (by id and by payment reference), last order
- emails used at checkout (these power `/orders`)
- game scores per merchant, music mute setting

`sessionStorage` holds the pending menu-order and tip payment references between the
redirect to the provider and the return. Clearing site data removes all of this.
`/orders` only shows orders placed from the same browser.

---

## Project layout

```
src/
  app/                      routes (see table above); layout.tsx sets metadata, viewport, providers
  components/
    HomeView.tsx            home page state: section, search, category, sort, page
    cards/                  place / event / dish / restaurant cards and skeletons
    checkout/               shared checkout pieces (steps, summary, payment picker, consent)
    restaurant/             restaurant storefront, item sheet, cart transfer sheet
    smart-menu/             order page, orders list, waiter panel
    games/                  wait-time games and leaderboard
    ui/                     shadcn/ui primitives
  constants/index.ts        backend URLs, enums for filters and sorts, page size
  data/listings.ts          section metadata and theme (no listing data, despite the name)
  hooks/                    TanStack Query hooks per domain (use-places, use-events, use-menu,
                            use-restaurants, use-order-live)
  lib/                      axios client, query provider, smart-menu storage, sound, clock
  utils/index.ts            formatting (₦ prices, dates), open-now status, event timing
public/                     fonts, images (incl. images/placeholder.svg fallback)
```

---

## Configuration

| File | Notable settings |
|---|---|
| [next.config.ts](next.config.ts) | `typescript.ignoreBuildErrors: true` means **type errors do not fail the build**. Run `npx tsc --noEmit` separately. `trailingSlash: true` means URLs end in `/`, and links and callback URLs must still resolve with it. `images.remotePatterns` allows only the DigitalOcean Spaces host. Add any new image CDN here or `next/image` will refuse it. `reactStrictMode: true`. |
| [src/lib/query-provider.tsx](src/lib/query-provider.tsx) | TanStack Query defaults: `staleTime` and `gcTime` 5 minutes, no refetch on window focus, the previous data stays on screen while new pages load. |
| [src/lib/api/axios-client.ts](src/lib/api/axios-client.ts) | Shared axios instance: base URL `SERVER_URL`, 100-second timeout, no auth interceptor. Most hooks pass absolute URLs for the other services. |
| [src/constants/index.ts](src/constants/index.ts) | Backend URLs, filter enums matching the server enums, sort mappings per endpoint, `PAGE_SIZE`. |
| [tailwind.config.ts](tailwind.config.ts), [src/app/globals.css](src/app/globals.css) | Design tokens, aurora background, motion and card styles. |
| [components.json](components.json) | shadcn/ui config (`new-york` style). Add primitives with `npx shadcn add <name>`. |
| [tsconfig.json](tsconfig.json) | `strict`, `noUnusedLocals` and `noUnusedParameters` are on. The `@/*` path alias points to `src/*`. |

Currency formatting is Nigerian naira (`₦`, `en-NG`) throughout.

---

## Deployment

The build has three **dynamic** routes (`/restaurants/[id]`, `/orders/[id]`, `/games/[game]`),
so the app needs a **Node.js server runtime**. It cannot be deployed as a static export
(`output: "export"`) without changing those routes. The repository has no Dockerfile, CI
workflow or platform config, so pick one of the options below.

### Option A: Vercel (simplest)

1. Import the GitHub repository into Vercel. It detects Next.js automatically.
2. Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the Production (and
   Preview) environments.
3. Deploy. A change to an environment variable needs a redeploy because the values are inlined at build time.

### Option B: any Node host or container

```bash
npm ci
NEXT_PUBLIC_SITE_URL=https://your-domain NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=... npm run build
npm run start -- -p 3000         # or set PORT
```

Run it behind a reverse proxy that terminates TLS. A minimal Dockerfile:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Pass the `NEXT_PUBLIC_*` values as **build args**. Setting them only at runtime has no effect.

---

## Production checklist

- [ ] `NEXT_PUBLIC_SITE_URL` set to the real HTTPS origin (otherwise social preview images point at localhost).
- [ ] Google Maps key restricted to the Maps Embed API and the production referrers.
- [ ] HTTPS everywhere. Payment providers expect HTTPS callback URLs, and browsers can restrict the Smart Menu's vibration and audio feedback on insecure origins.
- [ ] Confirm with the backend team that payment `callbackUrl`s on the production domain are
      accepted, and that Paystack and Fuspay are in **live** mode on their side.
- [ ] The backends must allow CORS from the production origin. The Socket.IO gateway currently allows `*`.
- [ ] Fly.io backends kept warm (minimum machines ≥ 1) for production traffic. Otherwise the
      first visitor after an idle period sees errors or slow loads.
- [ ] Decide how to handle **staging**: backend URLs are hard-coded, so every build talks to
      the same backends. Before a staging environment is needed, move them to `NEXT_PUBLIC_*` env vars.
- [ ] Run `npx tsc --noEmit` and `npm run lint` in CI, because the build skips type errors.
- [ ] The QR codes printed on tables must link to `https://<domain>/restaurants/<merchantUserId>/?number=<table>`.
- [ ] Add error monitoring and analytics. None is wired in at the moment.
- [ ] Caching: hashed `/_next/static/*` assets can be cached forever. HTML should not be cached by a CDN for long, so new deploys reach users.

---

## Known issues and limitations

- **`/login` links 404.** The event, place and menu checkouts link to `/login`, which does not
  exist in this app. Point them to the real sign-in URL or remove them.
- **Type and lint debt.** At the time of writing, `tsc` reports unused imports in
  `Header.tsx` and `HomeView.tsx`, and `npm run lint` reports 4 errors and 2 warnings.
  `ignoreBuildErrors` hides these from the build.
- **The table number is not sent to the backend.** Orders have no table field yet, so the table
  number exists only in the guest's browser.
- **Smart Menu state lives in the browser only** (see [State kept in the browser](#state-kept-in-the-browser)).
  If a guest changes phone or clears site data, they lose their order list, games and scores.
- **No tip or rating after release.** Once a waiter releases an order, the API blocks tips and
  ratings. This is an open product question.
- Waiter names and photos are not available from the API, and there is no "served" status.
- The restaurant name is generated ("Kitchen XXXX") when the merchant has no published place.
