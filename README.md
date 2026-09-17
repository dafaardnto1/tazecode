# TAZECODE

Jasa website murah — company profile, landing page, toko online, aplikasi web custom.
Frontend Vite + React (Cloudflare Pages), backend Hono API (Cloudflare Workers + D1), dengan dashboard admin self-service.

**Live:** https://tazecode.pages.dev — API: https://tazecode-api.dafaardianto466.workers.dev
See **[DEPLOY.md](DEPLOY.md)** for full redeploy commands and admin access.

## Struktur folder

```
/
├── frontend/         React + Vite — situs publik & dashboard admin (deploy ke Cloudflare Pages)
│   ├── src/
│   │   ├── components/   Header, Footer, Layout, ProjectCard, ProcessTimeline, WhatsAppFloat, Reveal, Seo, dll
│   │   ├── pages/        Home, Pricelist, Projects, ProjectDetail, Services, Contact, NotFound
│   │   ├── admin/        /admin dashboard — Login, Dashboard, Projects, Services, Pricing, Process, Testimonials, Messages, Analytics, Settings
│   │   ├── data/         projects.js — data statis fallback kalau API tidak terjangkau
│   │   ├── hooks/        useApiData.js (data live + fallback: projects, services, pricing, process steps, testimonials, settings)
│   │   ├── i18n/         Terjemahan ID/EN + language context
│   │   ├── lib/          api.js (client API), seoConfig.js
│   │   └── styles/       global.css (situs publik), admin.css (dashboard)
│   ├── public/           logo, favicon, og-image, robots.txt, sitemap.xml
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/          Cloudflare Worker API — Hono, D1, JWT auth (deploy ke Cloudflare Workers)
│   ├── src/
│   │   ├── index.js      Semua route: /api/projects, /api/services, /api/pricing, /api/process-steps,
│   │   │                 /api/testimonials, /api/messages, /api/settings, /api/auth, /api/upload, /api/analytics
│   │   └── auth.js        Hash password + signed token
│   ├── scripts/
│   │   └── reset-password.js   Reset password admin sendiri, tanpa perlu bantuan developer
│   ├── schema.sql         Definisi tabel D1
│   ├── seed.sql            Data seed untuk dev lokal
│   └── wrangler.toml
│
├── package.json       Script orkestrasi di root (opsional, lihat di bawah)
├── README.md
└── DEPLOY.md
```

## Jalankan lokal

Install semua sekaligus dari root:

```bash
npm run install:all
```

Jalankan frontend (pakai data statis fallback kalau API belum jalan):

```bash
npm run dev            # atau: cd frontend && npm run dev
```

Jalankan backend API (perlu `wrangler login` & konfigurasi D1 sekali di awal):

```bash
npm run dev:api         # atau: cd backend && npm run dev
```

Build frontend untuk production:

```bash
npm run build            # atau: cd frontend && npm run build
```

## Cloudflare (production)

- **Cloudflare Pages** (`tazecode.pages.dev`) — hasil build `frontend/dist`, dilihat pengunjung. Deploy: `npm run deploy` (root) atau `cd frontend && npm run deploy`.
- **Cloudflare Worker** (`tazecode-api`, di `tazecode-api.dafaardianto466.workers.dev`) — backend API. Deploy: `npm run deploy:api` (root) atau `cd backend && npm run deploy`.
- **D1** (`tazecode-db`) — tabel: projects, services, pricing_plans, process_steps, testimonials, messages, page_views, admin_users, site_settings.
- Untuk deploy keduanya sekaligus: `npm run deploy:all` (root).
- Gambar (thumbnail, foto testimoni) dikompres di sisi client dan disimpan base64 di D1 — tidak butuh R2. Lihat DEPLOY.md kalau mau pindah ke R2.

Situs publik mengambil data live dari API dan **fallback ke data statis** kalau API sedang tidak terjangkau — jadi situs tidak pernah benar-benar rusak walau Worker down.

## Dashboard admin

Buka `/admin/login`. Dari sana bisa kelola Projects, Services, Harga/Pricelist, Cara Kerja, Testimonials (review asli klien saja — jangan pernah isi data testimoni palsu), baca pesan Contact, lihat Analitik kunjungan, dan atur stats homepage/kontak/foto lewat Settings. Tidak perlu ubah kode untuk update konten apa pun.

**Lupa password?** Jalankan dari folder `backend/`:

```bash
npm run reset-password -- "PasswordBaruAnda123"
```

## Deploy

Lihat **[DEPLOY.md](DEPLOY.md)** untuk perintah redeploy lengkap dan setup dev lokal.
