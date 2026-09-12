# Berkeley Hope Garden

A mobile-first digital garden for the September 21, 2026 NMDP tabling session on Bancroft Way, Berkeley.

## Local setup

Requires Node.js 24 and a Neon Postgres database. The app builds without credentials; shared planting and statistics need a configured database.

```bash
npm ci
cp .env.example .env.local
```

Put your Neon connection string in DATABASE_URL inside .env.local, then:

```bash
npm run db:setup
npm run dev
```

Open http://localhost:3000. Database setup is repeatable and preserves existing rows. Never commit .env.local.

## GitHub and Vercel deployment

1. Create an empty GitHub repository. Extract the ZIP and enter the berkeley-hope-garden-vercel folder. Push its contents:

```bash
git init
git add .
git commit -m "Initial Hope Garden production export"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

2. Import the repository in Vercel. Select Next.js and Node.js 24.x. The root directory is the folder containing package.json, normally the repository root. The included vercel.json selects npm ci and npm run build.
3. Create or connect a Neon Postgres database through Vercel Marketplace or Neon. Add its connection string as the server-only DATABASE_URL environment variable in Vercel. Do not prefix it with NEXT_PUBLIC_.
4. Put that same URL in your local .env.local and run npm run db:setup once before enabling public planting. Use a separate database or Neon branch for Preview environments so test activity does not mix with public activity.
5. Deploy, or redeploy after adding environment variables. Visit the home page, plant once, reload, and check /results. Download the calendar and check September 21, 10 AM–12 PM Pacific Time.
6. Update printed QR codes and Instagram stickers to your final Vercel/custom domain. Preserve ?from=leaflet and ?from=social for source attribution. Website sharing automatically uses its current domain.

Future GitHub pushes deploy automatically. No Cloudflare Worker, D1 binding, Sites account or special build service is needed.

## Logging architecture

- GET /api/garden initializes a cryptographically random UUID cookie and returns shared totals, the latest 48 flowers, and this session's flower.
- The cookie is HttpOnly, SameSite=Lax and Secure over HTTPS, with no explicit expiry. It identifies a browser session, not a verified person. Browsers may restore session cookies across restarts.
- POST /api/garden accepts same-origin JSON with a valid initialized cookie. Bodies are limited to 2 KB. Input validation and SQL constraints enforce allowed interaction types, invitation sources and flower IDs.
- Visits and plants use unique keys derived from their type and session ID. Postgres ON CONFLICT DO NOTHING makes retries and simultaneous submissions idempotent.
- Calendar and NMDP clicks use event UUIDs: retries of one action count once; separate clicks may count again.
- An integer flower identity preserves the visitor's palette and posture. The page refreshes the shared counter every 30 seconds while visible.
- /results and /api/results expose public aggregates by UTC day, invitation source and action. CSV exports contain those aggregates. This application does not store names, contact details, health data or IP addresses. Platform operational logs are separate.
- Postgres persists across Vercel instances. No production data lives in server-local files or in-memory counters.
- Counts are interactions, not verified unique people, calendar saves, attendance or registry signups. Cookie clearing and bots can inflate totals; use Vercel Firewall/rate limits if needed.

This export contains code and assets, not the current Sites database or credentials. A fresh database starts at zero. Preserve the existing site's CSV separately for your assignment; aggregate CSV totals cannot reconstruct session-level records.

## Design and modules

The existing responsive seed → planting → growth → garden → information sequence, leaflet-style flowers, natural posture, five palettes, chimes, mute control, reduced-motion support and keyboard/skip access are included.

As requested for this export, Cormorant Garamond provides editorial serif headings and IBM Plex Mono provides metadata labels. Fonts are bundled through Fontsource, so production builds do not fetch Google Fonts. Body text uses system sans-serif fonts.

| File                                              | Responsibility                                     |
| ------------------------------------------------- | -------------------------------------------------- |
| components/hope-garden.tsx                        | Main interaction state machine and client tracking |
| components/luminous-flower.tsx                    | Flower presentation                                |
| components/garden-information.tsx                 | Semantic event and educational content             |
| lib/flower-identity.ts                            | Stable colors, scale, posture and sway             |
| lib/use-garden-audio.ts, lib/garden-soundscape.ts | Optional synthesized wind chimes                   |
| lib/interactions.ts                               | Session cookie and input validation                |
| lib/garden-store.ts                               | Idempotent Postgres reads and writes               |
| lib/database.ts                                   | Server-only Neon connection                        |
| db/schema.sql, scripts/setup-db.mjs               | Repeatable database setup                          |
| lib/calendar.ts                                   | Calendar generation and event constants            |
| app/results/page.tsx                              | Aggregate activity and CSV                         |
| tailwind.config.js                                | Palette, font, radius and shadow tokens            |
| app/globals.css                                   | Responsive scenes, glass, motion and typography    |
| public/                                           | Optimized WebP assets and favicon                  |

Tailwind v4 loads tailwind.config.js through the explicit @config directive in globals.css. No unused starter component library or Cloudflare dependencies are included.

The calendar endpoint /nmdp-event.ics uses 2026-09-21 17:00–19:00 UTC, equivalent to 10 AM–12 PM in America/Los_Angeles (PDT). A click logs an action, not a completed calendar save. The event details and existing NMDP educational wording are preserved.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm start
```

Tests run the real SQL schema and queries against PGlite's Postgres engine, covering concurrent/repeated planting, shared totals, source attribution, invalid inputs, cookie attributes, origin checks and calendar formatting. No external database is needed for these tests.

The ZIP contains package-lock.json for reproducible installation. It excludes node_modules, .next, .env.local, .git, platform metadata and live interaction records. Font packages include their licenses; project artwork is supplied/generated. No third-party music recording is embedded.

The production build is checked locally. Verify the actual Neon connection and Vercel environment after deployment; this package does not create accounts, provision a live database, push to GitHub or deploy on your behalf.

Official references: [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [Tailwind configuration directives](https://tailwindcss.com/docs/functions-and-directives).
