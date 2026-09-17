# TAZECODE — Live Deployment

## Live URLs

- **Public site:** https://tazecode.pages.dev
- **Admin dashboard:** https://tazecode.pages.dev/admin/login
- **API (Worker):** https://tazecode-api.dafaardianto466.workers.dev

## Architecture

```
Cloudflare D1 (tazecode-db)   ←── SQL ──   Worker API (backend/, name: "tazecode-api")
                                        ↑
                                   fetch("/api/…")
                                        ↑
                      React app (Vite, frontend/) ── public site + /admin dashboard
                      deployed to Cloudflare Pages (project: "tazecode")
```

Frontend and backend are two **separate** Cloudflare deployments — Pages for the static site, a Worker for the API. They are deployed independently; changing one does not require redeploying the other.

Images (project thumbnails, testimonial photos, about photo) are resized/compressed client-side and stored as base64 data URIs directly in D1 — **R2 is not required**. This was a deliberate workaround: R2 requires a one-time manual "Enable R2" click in the Cloudflare dashboard that couldn't be completed programmatically. If R2 gets enabled later, the Worker's `/api/upload` endpoint (R2-based) still exists and can be switched back to for larger media libraries — see "Switching to R2" below.

## Redeploying after code changes

From the project root, using the orchestration scripts:
```bash
npm run deploy        # frontend only → Cloudflare Pages
npm run deploy:api    # backend only → Cloudflare Worker
npm run deploy:all    # both, API first then frontend
```

Or directly in each folder:
```bash
# Frontend
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=tazecode

# Backend
cd backend
npx wrangler deploy
```

**Important — never create a `wrangler.jsonc`/`wrangler.toml` at the project root.** Doing so previously caused Wrangler to auto-discover the wrong config when deploying the backend (it picked up the frontend's static assets and served HTML instead of JSON on every `/api/*` route). Each deploy config must stay inside its own folder (`frontend/` uses Pages CLI directly with no Workers config; `backend/wrangler.toml` is the only Workers config in the repo).

## Local development

Terminal 1 — API:
```bash
cd backend
npm install
npx wrangler d1 execute tazecode-db --local --file=schema.sql
npx wrangler d1 execute tazecode-db --local --file=seed.sql
npm run dev   # http://127.0.0.1:8787
```

Terminal 2 — Frontend:
```bash
cd frontend
npm install
echo "VITE_API_URL=http://127.0.0.1:8787" > .env.local
npm run dev
```

Or from the root: `npm run install:all`, then `npm run dev:api` and `npm run dev` in two terminals.

## Admin dashboard

Login at `/admin/login`. Change the password anytime from **Settings** in the dashboard, or reset it yourself without needing a developer:

```bash
cd backend
npm run reset-password -- "YourNewPassword123"
```

This computes the hash and writes it straight to the production D1 database. No manual hashing, no need to ask anyone for help.

From the dashboard you can manage:
- **Projects** — full CRUD, thumbnail upload
- **Services**
- **Harga / Pricelist** — pricing plans shown on `/harga`
- **Cara Kerja** — process steps shown as an animated timeline on the homepage
- **Testimonials** — client reviews with photo, rating, publish/draft toggle (only published ones show on the public site — never seeded with fake reviews)
- **Messages** — contact form inbox (protected by a honeypot field + IP rate limiting server-side)
- **Analytics** — internal page-view tracking (total/7-day/30-day visits, daily chart, top pages, referrers). For real Google search keyword/impression data, register the site separately at [Google Search Console](https://search.google.com/search-console) — that data isn't obtainable through this dashboard.
- **Settings** — homepage stats, contact links, about photo, admin password

### Email notification on new contact messages (optional)

The backend already has the code to email you when someone submits the contact form, via [Resend](https://resend.com) (free tier). To activate it:

1. Sign up at resend.com, get an API key
2. Set the secrets:
   ```bash
   cd backend
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put NOTIFY_EMAIL   # where notifications should go
   ```
3. Redeploy: `npm run deploy`

Without these secrets set, the contact form still works normally — messages just aren't emailed, only visible in the dashboard's Messages tab.

## Switching to R2 (optional, for larger media libraries)

The base64-in-D1 approach works well for small avatar/thumbnail images but isn't ideal at scale. To switch to R2 later:

1. Cloudflare dashboard → **R2 Object Storage** → **Enable R2**
2. `cd backend && npx wrangler r2 bucket create tazecode-media`
3. Uncomment the `[[r2_buckets]]` block in `backend/wrangler.toml`
4. `npx wrangler deploy`
5. Swap `frontend/src/admin/components/ImageUpload.jsx`'s client-side compression for a call to `api.uploadMedia(file)` (already implemented in `frontend/src/lib/api.js`, just unused)

## Housekeeping note

There is an old, unused Cloudflare Worker named **`tazecode`** (at `tazecode.dafaardianto466.workers.dev`) left over from an earlier deployment approach (deploying the frontend as a Worker with static assets, before the project moved to Cloudflare Pages). It is not referenced anywhere in this repo anymore and can be deleted from the Cloudflare dashboard (Workers & Pages → tazecode → Delete) whenever convenient — it serves stale content and isn't linked from the live site.
