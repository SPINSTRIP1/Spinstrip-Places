# SpinStrip Places

Discovery front-end for SpinStrip Places — browse merchant listings (places, events,
menus) and open a restaurant's branded menu with cart and demo checkout.

Built with **Next.js (App Router)**, React 19, TypeScript, Tailwind CSS v3 and
shadcn/ui.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint (eslint-config-next, flat config)
```

## Project layout

```
src/
  app/
    layout.tsx                  root layout: metadata, viewport, next/font, globals.css
    page.tsx                    /            → renders HomeView
    not-found.tsx               404 page
    restaurants/[id]/page.tsx   /restaurants/:id  → server component, SSG per restaurant
    globals.css                 tailwind layers + design system (aurora, motion, cards)
  components/
    HomeView.tsx                client component: search / section / category / sort state
    restaurant/                 restaurant page, menu cards, item + cart sheets
    ui/                         shadcn/ui primitives
  data/                         listings + restaurant fixtures (typed, static)
  hooks/  lib/
```

## Routing

Navigation is URL-driven. The home page pushes `/restaurants/{id}` when a Menu
listing is tapped; `generateStaticParams` prerenders every restaurant in
`src/data/restaurants.ts`, and unknown ids render the 404 page.

## Notes

- Images live in `public/images` and are served through `next/image`.
- Inter and Sora are loaded with `next/font/google` and exposed as the
  `--font-inter` / `--font-sora` CSS variables (see `tailwind.config.ts`).
- The cart persists to `localStorage` per restaurant and is restored after mount
  so server-rendered HTML and the first client render stay in sync.
- Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) so Open Graph image URLs resolve
  against the real origin in production.
