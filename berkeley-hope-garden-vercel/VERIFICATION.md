# Export verification

Verified September 11, 2026:

- TypeScript strict check passed.
- All five automated tests passed, including real Postgres queries through PGlite, concurrent plant deduplication, validation, session cookies, and calendar formatting.
- Next.js production build completed successfully.
- Production HTTP checks: homepage, results page, and calendar endpoint returned 200.
- Calendar contains September 21, 2026, 17:00–19:00 UTC (10 AM–12 PM PDT).
- With no DATABASE_URL configured, the garden API returns its intended 503 response.

A live Neon connection and Vercel deployment have not been provisioned or tested. Follow README.md to configure them.
