import { Hono } from "hono";
import { cors } from "hono/cors";
import { hashPassword, signToken, requireAuth } from "./auth.js";

const app = new Hono();

const ALLOWED_ORIGINS = [
  "https://tazecode.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return ALLOWED_ORIGINS[0]; // same-origin/non-browser requests send no Origin header
      if (ALLOWED_ORIGINS.includes(origin) || /\.tazecode\.pages\.dev$/.test(new URL(origin).hostname)) return origin;
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

// Security headers on every response — this API only ever returns JSON, so a
// locked-down CSP is safe and blocks it from ever being framed/embedded or
// used to load active content even if a response were somehow mis-rendered.
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
});

// Generic IP-based rate limiter backed by D1. Returns true if the request is
// allowed (and records it), false if the caller has exceeded the limit.
async function checkRateLimit(env, ip, bucket, maxCount, windowMinutes) {
  if (!ip) return true; // no CF-Connecting-IP header (e.g. local dev) — don't block
  const recent = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM rate_limits WHERE bucket = ? AND ip = ? AND created_at >= datetime('now', '-${windowMinutes} minutes')`
  ).bind(bucket, ip).first();
  if ((recent?.n || 0) >= maxCount) return false;
  await env.DB.prepare("INSERT INTO rate_limits (bucket, ip) VALUES (?, ?)").bind(bucket, ip).run();
  if (Math.random() < 0.02) {
    await env.DB.prepare("DELETE FROM rate_limits WHERE created_at < datetime('now', '-1 day')").run();
  }
  return true;
}

function parseJsonField(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeProject(row) {
  return {
    ...row,
    features: parseJsonField(row.features, []),
    tech: parseJsonField(row.tech, []),
    featured: !!row.featured
  };
}

function serializeService(row) {
  return { ...row, features: parseJsonField(row.features, []) };
}

/* ---------------------------- Public: health ---------------------------- */
app.get("/api/health", (c) => c.json({ ok: true }));

/* ---------------------------- Auto-translate (ID -> EN) ---------------------------- */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function translateOne(env, rawText) {
  const text = String(rawText ?? "").slice(0, 3000);
  if (!text.trim()) return text;

  const hash = await sha256Hex(`en|${text}`);
  const cached = await env.DB.prepare("SELECT translated_text FROM translation_cache WHERE hash = ?").bind(hash).first();
  if (cached) return cached.translated_text;

  try {
    const out = await env.AI.run("@cf/meta/m2m100-1.2b", { text, source_lang: "id", target_lang: "en" });
    const translated = (out && out.translated_text) ? out.translated_text : text;
    await env.DB.prepare(
      "INSERT INTO translation_cache (hash, translated_text) VALUES (?, ?) ON CONFLICT(hash) DO NOTHING"
    ).bind(hash, translated).run();
    return translated;
  } catch {
    return text;
  }
}

// Runs translations with limited concurrency (Workers AI calls are I/O-bound —
// parallelizing turns a 60-string page from ~90s to a few seconds).
async function translateBatch(env, texts) {
  const CONCURRENCY = 10;
  const results = new Array(texts.length);
  let next = 0;
  async function worker() {
    while (next < texts.length) {
      const i = next++;
      results[i] = await translateOne(env, texts[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker));
  return results;
}

app.post("/api/translate", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "";
  const allowed = await checkRateLimit(c.env, ip, "translate", 40, 10);
  if (!allowed) return c.json({ error: "Too many requests" }, 429);

  const b = await c.req.json().catch(() => ({}));
  const texts = Array.isArray(b.texts) ? b.texts.slice(0, 120) : [];
  if (texts.length === 0) return c.json({ translations: [] });

  const results = await translateBatch(c.env, texts);
  return c.json({ translations: results });
});

/* ---------------------------- Auth ---------------------------- */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

app.post("/api/auth/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "unknown";

  const recentFailed = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND success = 0 AND created_at >= datetime('now', '-${LOGIN_WINDOW_MINUTES} minutes')`
  ).bind(ip).first();
  if ((recentFailed?.n || 0) >= LOGIN_MAX_ATTEMPTS) {
    return c.json({ error: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${LOGIN_WINDOW_MINUTES} menit.` }, 429);
  }

  const b = await c.req.json().catch(() => ({}));
  const username = (b.username || "").trim();
  const password = (b.password || "").trim();
  if (!username || !password) return c.json({ error: "Username and password required" }, 400);

  const user = await c.env.DB.prepare("SELECT * FROM admin_users WHERE username = ?").bind(username).first();
  const hash = await hashPassword(password);
  const valid = user && hash === user.password_hash;

  await c.env.DB.prepare("INSERT INTO login_attempts (ip, success) VALUES (?, ?)").bind(ip, valid ? 1 : 0).run();

  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const token = await signToken({ sub: user.id, username: user.username }, c.env.JWT_SECRET);
  return c.json({ token, username: user.username });
});

app.get("/api/auth/me", requireAuth, (c) => c.json({ user: c.get("user") }));

app.post("/api/auth/change-password", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const currentPassword = (b.currentPassword || "").trim();
  const newPassword = (b.newPassword || "").trim();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return c.json({ error: "Invalid input — new password must be at least 8 characters." }, 400);
  }
  const user = c.get("user");
  const row = await c.env.DB.prepare("SELECT * FROM admin_users WHERE id = ?").bind(user.sub).first();
  if (!row) return c.json({ error: "User not found" }, 404);

  const currentHash = await hashPassword(currentPassword);
  if (currentHash !== row.password_hash) return c.json({ error: "Current password is incorrect" }, 401);

  const newHash = await hashPassword(newPassword);
  await c.env.DB.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").bind(newHash, user.sub).run();

  // Verify the write actually landed before telling the client it succeeded.
  const check = await c.env.DB.prepare("SELECT password_hash FROM admin_users WHERE id = ?").bind(user.sub).first();
  if (check?.password_hash !== newHash) {
    return c.json({ error: "Password change did not save correctly. Please try again." }, 500);
  }

  return c.json({ ok: true });
});

/* ---------------------------- Projects (public read) ---------------------------- */
app.get("/api/projects", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM projects ORDER BY sort_order ASC, id ASC").all();
  return c.json(results.map(serializeProject));
});

app.get("/api/projects/:slug", async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM projects WHERE slug = ?").bind(c.req.param("slug")).first();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(serializeProject(row));
});

/* ---------------------------- Projects (admin write) ---------------------------- */
app.post("/api/projects", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.slug || !b.name) return c.json({ error: "slug and name are required" }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM projects WHERE slug = ?").bind(b.slug).first();
  if (existing) return c.json({ error: "A project with this slug already exists" }, 409);

  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM projects").first();

  const result = await c.env.DB.prepare(
    `INSERT INTO projects (slug, name, category, year, client, role, duration, description, problem, solution, features, challenges, result, tech, live, github, thumbnail_url, featured, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      b.slug, b.name, b.category || "", b.year || "", b.client || "", b.role || "", b.duration || "",
      b.description || "", b.problem || "", b.solution || "",
      JSON.stringify(b.features || []), b.challenges || "", b.result || "",
      JSON.stringify(b.tech || []), b.live || "", b.github || "", b.thumbnail_url || "",
      b.featured ? 1 : 0, maxOrder.m + 1
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(serializeProject(row), 201);
});

app.put("/api/projects/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE projects SET slug=?, name=?, category=?, year=?, client=?, role=?, duration=?, description=?, problem=?, solution=?, features=?, challenges=?, result=?, tech=?, live=?, github=?, thumbnail_url=?, featured=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  )
    .bind(
      b.slug ?? existing.slug, b.name ?? existing.name, b.category ?? existing.category,
      b.year ?? existing.year, b.client ?? existing.client, b.role ?? existing.role, b.duration ?? existing.duration,
      b.description ?? existing.description, b.problem ?? existing.problem, b.solution ?? existing.solution,
      JSON.stringify(b.features ?? JSON.parse(existing.features || "[]")),
      b.challenges ?? existing.challenges, b.result ?? existing.result,
      JSON.stringify(b.tech ?? JSON.parse(existing.tech || "[]")),
      b.live ?? existing.live, b.github ?? existing.github, b.thumbnail_url ?? existing.thumbnail_url,
      b.featured !== undefined ? (b.featured ? 1 : 0) : existing.featured,
      b.sort_order ?? existing.sort_order,
      id
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  return c.json(serializeProject(row));
});

app.delete("/api/projects/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM project_images WHERE project_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/* ---------------------------- Services ---------------------------- */
app.get("/api/services", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM services ORDER BY sort_order ASC, id ASC").all();
  return c.json(results.map(serializeService));
});

app.post("/api/services", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.title) return c.json({ error: "title is required" }, 400);
  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM services").first();
  const result = await c.env.DB.prepare(
    "INSERT INTO services (title, description, features, sort_order, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
  )
    .bind(b.title, b.description || "", JSON.stringify(b.features || []), maxOrder.m + 1)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(serializeService(row), 201);
});

app.put("/api/services/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    "UPDATE services SET title=?, description=?, features=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
  )
    .bind(
      b.title ?? existing.title,
      b.description ?? existing.description,
      JSON.stringify(b.features ?? JSON.parse(existing.features || "[]")),
      b.sort_order ?? existing.sort_order,
      id
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM services WHERE id = ?").bind(id).first();
  return c.json(serializeService(row));
});

app.delete("/api/services/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM services WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Pricing plans ---------------------------- */
function serializePricing(row) {
  return { ...row, features: parseJsonField(row.features, []), is_popular: !!row.is_popular };
}

app.get("/api/pricing", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM pricing_plans ORDER BY sort_order ASC, id ASC").all();
  return c.json(results.map(serializePricing));
});

app.post("/api/pricing", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.name || !b.price) return c.json({ error: "name and price are required" }, 400);
  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM pricing_plans").first();
  const result = await c.env.DB.prepare(
    `INSERT INTO pricing_plans (name, price, price_suffix, description, features, is_popular, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      b.name, b.price, b.price_suffix || "", b.description || "",
      JSON.stringify(b.features || []), b.is_popular ? 1 : 0, maxOrder.m + 1
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM pricing_plans WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(serializePricing(row), 201);
});

app.put("/api/pricing/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM pricing_plans WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE pricing_plans SET name=?, price=?, price_suffix=?, description=?, features=?, is_popular=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  )
    .bind(
      b.name ?? existing.name,
      b.price ?? existing.price,
      b.price_suffix ?? existing.price_suffix,
      b.description ?? existing.description,
      JSON.stringify(b.features ?? JSON.parse(existing.features || "[]")),
      b.is_popular !== undefined ? (b.is_popular ? 1 : 0) : existing.is_popular,
      b.sort_order ?? existing.sort_order,
      id
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM pricing_plans WHERE id = ?").bind(id).first();
  return c.json(serializePricing(row));
});

app.delete("/api/pricing/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM pricing_plans WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Process steps ("Cara Kerja") ---------------------------- */
app.get("/api/process-steps", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM process_steps ORDER BY sort_order ASC, id ASC").all();
  return c.json(results);
});

app.post("/api/process-steps", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.title) return c.json({ error: "title is required" }, 400);
  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM process_steps").first();
  const result = await c.env.DB.prepare(
    "INSERT INTO process_steps (title, description, sort_order, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
  )
    .bind(b.title, b.description || "", maxOrder.m + 1)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM process_steps WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(row, 201);
});

app.put("/api/process-steps/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM process_steps WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    "UPDATE process_steps SET title=?, description=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
  )
    .bind(b.title ?? existing.title, b.description ?? existing.description, b.sort_order ?? existing.sort_order, id)
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM process_steps WHERE id = ?").bind(id).first();
  return c.json(row);
});

app.delete("/api/process-steps/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM process_steps WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Newsletter subscribers ---------------------------- */
app.post("/api/subscribe", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "";
  const allowed = await checkRateLimit(c.env, ip, "subscribe", 5, 60);
  if (!allowed) return c.json({ error: "Too many requests. Please try again later." }, 429);

  const b = await c.req.json().catch(() => ({}));
  const email = (b.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "Email tidak valid" }, 400);
  }
  const existing = await c.env.DB.prepare("SELECT id FROM subscribers WHERE email = ?").bind(email).first();
  if (existing) return c.json({ ok: true, alreadySubscribed: true });

  await c.env.DB.prepare("INSERT INTO subscribers (email) VALUES (?)").bind(email).run();
  return c.json({ ok: true }, 201);
});

app.get("/api/subscribers", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM subscribers ORDER BY created_at DESC").all();
  return c.json(results);
});

app.delete("/api/subscribers/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM subscribers WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Project gallery images ---------------------------- */
app.get("/api/project-images/:projectId", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, id ASC"
  ).bind(c.req.param("projectId")).all();
  return c.json(results);
});

app.post("/api/project-images", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.project_id || !b.image_url) return c.json({ error: "project_id and image_url are required" }, 400);

  const count = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM project_images WHERE project_id = ?")
    .bind(b.project_id).first();
  if ((count?.n || 0) >= 10) return c.json({ error: "Maksimal 10 foto per project" }, 400);

  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_images WHERE project_id = ?")
    .bind(b.project_id).first();
  const result = await c.env.DB.prepare(
    "INSERT INTO project_images (project_id, image_url, sort_order) VALUES (?, ?, ?)"
  )
    .bind(b.project_id, b.image_url, maxOrder.m + 1)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM project_images WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(row, 201);
});

app.put("/api/project-images/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  if (!b.image_url) return c.json({ error: "image_url is required" }, 400);
  const existing = await c.env.DB.prepare("SELECT * FROM project_images WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);
  await c.env.DB.prepare("UPDATE project_images SET image_url = ? WHERE id = ?").bind(b.image_url, id).run();
  const row = await c.env.DB.prepare("SELECT * FROM project_images WHERE id = ?").bind(id).first();
  return c.json(row);
});

app.delete("/api/project-images/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM project_images WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Articles (blog) ---------------------------- */
app.get("/api/articles", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM articles WHERE is_published = 1 ORDER BY created_at DESC"
  ).all();
  return c.json(results.map((r) => ({ ...r, is_published: !!r.is_published })));
});

app.get("/api/articles/all", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
  return c.json(results.map((r) => ({ ...r, is_published: !!r.is_published })));
});

app.get("/api/articles/:slug", async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM articles WHERE slug = ? AND is_published = 1")
    .bind(c.req.param("slug"))
    .first();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ ...row, is_published: !!row.is_published });
});

app.post("/api/articles", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.slug || !b.title || !b.content) return c.json({ error: "slug, title, and content are required" }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM articles WHERE slug = ?").bind(b.slug).first();
  if (existing) return c.json({ error: "An article with this slug already exists" }, 409);

  const result = await c.env.DB.prepare(
    `INSERT INTO articles (slug, title, excerpt, content, cover_image_url, is_published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(b.slug, b.title, b.excerpt || "", b.content, b.cover_image_url || "", b.is_published !== false ? 1 : 0)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM articles WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json({ ...row, is_published: !!row.is_published }, 201);
});

app.put("/api/articles/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  if (b.slug && b.slug !== existing.slug) {
    const dupe = await c.env.DB.prepare("SELECT id FROM articles WHERE slug = ? AND id != ?").bind(b.slug, id).first();
    if (dupe) return c.json({ error: "An article with this slug already exists" }, 409);
  }

  await c.env.DB.prepare(
    `UPDATE articles SET slug=?, title=?, excerpt=?, content=?, cover_image_url=?, is_published=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  )
    .bind(
      b.slug ?? existing.slug,
      b.title ?? existing.title,
      b.excerpt ?? existing.excerpt,
      b.content ?? existing.content,
      b.cover_image_url ?? existing.cover_image_url,
      b.is_published !== undefined ? (b.is_published ? 1 : 0) : existing.is_published,
      id
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  return c.json({ ...row, is_published: !!row.is_published });
});

app.delete("/api/articles/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- FAQ ---------------------------- */
app.get("/api/faqs", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM faqs ORDER BY sort_order ASC, id ASC").all();
  return c.json(results);
});

app.post("/api/faqs", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.question || !b.answer) return c.json({ error: "question and answer are required" }, 400);
  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM faqs").first();
  const result = await c.env.DB.prepare(
    "INSERT INTO faqs (question, answer, sort_order, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
  )
    .bind(b.question, b.answer, maxOrder.m + 1)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM faqs WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(row, 201);
});

app.put("/api/faqs/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM faqs WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    "UPDATE faqs SET question=?, answer=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
  )
    .bind(b.question ?? existing.question, b.answer ?? existing.answer, b.sort_order ?? existing.sort_order, id)
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM faqs WHERE id = ?").bind(id).first();
  return c.json(row);
});

app.delete("/api/faqs/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM faqs WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Analytics (lightweight page-view tracking) ---------------------------- */
app.post("/api/track", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || "";
  const allowed = await checkRateLimit(c.env, ip, "track", 120, 10);
  if (!allowed) return c.json({ ok: true }); // silently drop, don't error out a real visitor's page

  const b = await c.req.json().catch(() => ({}));
  if (!b.path) return c.json({ error: "path is required" }, 400);
  await c.env.DB.prepare("INSERT INTO page_views (path, referrer) VALUES (?, ?)")
    .bind(String(b.path).slice(0, 500), String(b.referrer || "").slice(0, 500))
    .run();
  return c.json({ ok: true }, 201);
});

app.get("/api/analytics/summary", requireAuth, async (c) => {
  const totalRow = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM page_views").first();
  const last7 = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now', '-7 days')"
  ).first();
  const last30 = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now', '-30 days')"
  ).first();
  const byPath = await c.env.DB.prepare(
    "SELECT path, COUNT(*) AS views FROM page_views WHERE created_at >= datetime('now', '-30 days') GROUP BY path ORDER BY views DESC LIMIT 12"
  ).all();
  const byDay = await c.env.DB.prepare(
    "SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS views FROM page_views WHERE created_at >= datetime('now', '-14 days') GROUP BY day ORDER BY day ASC"
  ).all();
  const byReferrer = await c.env.DB.prepare(
    "SELECT CASE WHEN referrer IS NULL OR referrer = '' THEN 'Langsung' ELSE referrer END AS referrer, COUNT(*) AS views FROM page_views WHERE created_at >= datetime('now', '-30 days') GROUP BY referrer ORDER BY views DESC LIMIT 10"
  ).all();
  return c.json({
    total: totalRow?.n || 0,
    last7Days: last7?.n || 0,
    last30Days: last30?.n || 0,
    byPath: byPath.results || [],
    byDay: byDay.results || [],
    byReferrer: byReferrer.results || []
  });
});

/* ---------------------------- Messages (contact form) ---------------------------- */
app.post("/api/messages", async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.name || !b.email || !b.message) return c.json({ error: "name, email, and message are required" }, 400);
  if (b.website) return c.json({ ok: true, id: 0 }, 201); // honeypot tripped — silently accept, don't store

  const ip = c.req.header("CF-Connecting-IP") || "";
  if (ip) {
    const recent = await c.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM messages WHERE ip = ? AND created_at >= datetime('now', '-1 hour')"
    ).bind(ip).first();
    if ((recent?.n || 0) >= 5) return c.json({ error: "Too many messages. Please try again later." }, 429);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO messages (name, email, phone, subject, message, ip) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      String(b.name).slice(0, 200),
      String(b.email).slice(0, 200),
      String(b.phone || "").slice(0, 50),
      String(b.subject || "").slice(0, 300),
      String(b.message).slice(0, 5000),
      ip
    )
    .run();

  if (c.env.RESEND_API_KEY && c.env.NOTIFY_EMAIL) {
    const esc = (s) => String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    let waDigits = String(b.phone || "").replace(/\D/g, "");
    if (waDigits.startsWith("0")) waDigits = "62" + waDigits.slice(1);
    else if (waDigits && !waDigits.startsWith("62")) waDigits = "62" + waDigits;
    const waLink = waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Halo ${b.name}, terima kasih sudah menghubungi TAZECODE. Terkait pesan Anda: "${b.subject || b.message.slice(0, 50)}" —`)}`
      : null;
    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f5f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7e0;">
        <tr>
          <td style="background:#3f4f3d;padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">TAZECODE</span>
            <div style="color:#c9d4c6;font-size:13px;margin-top:4px;">Pesan baru dari form kontak</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;width:90px;vertical-align:top;">Nama</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${esc(b.name)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Email</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;"><a href="mailto:${esc(b.email)}" style="color:#3f4f3d;text-decoration:none;font-weight:600;">${esc(b.email)}</a></td>
              </tr>
              ${waDigits ? `<tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">WhatsApp</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">+${waDigits}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Subjek</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;">${esc(b.subject) || "<em>(tanpa subjek)</em>"}</td>
              </tr>
            </table>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7e0;">
              <div style="color:#6b7280;font-size:13px;margin-bottom:8px;">Pesan</div>
              <div style="color:#1f2937;font-size:14px;line-height:1.6;white-space:pre-wrap;background:#f9faf8;border-radius:8px;padding:16px;">${esc(b.message)}</div>
            </div>
            <div style="margin-top:24px;">
              <a href="mailto:${esc(b.email)}?subject=${encodeURIComponent("Re: " + (b.subject || "Pesan Anda di TAZECODE"))}" style="display:inline-block;background:#3f4f3d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;margin-right:10px;">Balas via Email</a>
              ${waLink ? `<a href="${waLink}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">Balas via WhatsApp</a>` : ""}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9faf8;border-top:1px solid #e5e7e0;">
            <span style="color:#9ca3af;font-size:12px;">Dikirim otomatis dari form kontak tazecode.pages.dev</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    c.executionCtx.waitUntil(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: c.env.NOTIFY_FROM || "TAZECODE <onboarding@resend.dev>",
          to: [c.env.NOTIFY_EMAIL],
          reply_to: b.email,
          subject: `Pesan baru dari ${b.name} — ${b.subject || "(tanpa subjek)"}`,
          html,
          text: `Nama: ${b.name}\nEmail: ${b.email}\nSubjek: ${b.subject || "-"}\n\n${b.message}`
        })
      }).catch(() => {})
    );
  }

  return c.json({ ok: true, id: result.meta.last_row_id }, 201);
});

app.get("/api/messages", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM messages ORDER BY created_at DESC").all();
  return c.json(results.map((r) => ({ ...r, is_read: !!r.is_read })));
});

app.patch("/api/messages/:id", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  await c.env.DB.prepare("UPDATE messages SET is_read = ? WHERE id = ?")
    .bind(b.is_read ? 1 : 0, c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

app.delete("/api/messages/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Testimonials ---------------------------- */
app.get("/api/testimonials", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC, id DESC"
  ).all();
  return c.json(results.map((r) => ({ ...r, is_published: !!r.is_published })));
});

app.get("/api/testimonials/all", requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM testimonials ORDER BY sort_order ASC, id DESC").all();
  return c.json(results.map((r) => ({ ...r, is_published: !!r.is_published })));
});

app.post("/api/testimonials", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b.client_name || !b.review_text) return c.json({ error: "client_name and review_text are required" }, 400);
  const maxOrder = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM testimonials").first();
  const result = await c.env.DB.prepare(
    `INSERT INTO testimonials (client_name, client_position, client_company, photo_url, review_text, project_slug, rating, is_published, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      b.client_name, b.client_position || "", b.client_company || "", b.photo_url || "",
      b.review_text, b.project_slug || "", b.rating ?? 5, b.is_published !== false ? 1 : 0, maxOrder.m + 1
    )
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM testimonials WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json({ ...row, is_published: !!row.is_published }, 201);
});

app.put("/api/testimonials/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare("SELECT * FROM testimonials WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare(
    `UPDATE testimonials SET client_name=?, client_position=?, client_company=?, photo_url=?, review_text=?, project_slug=?, rating=?, is_published=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  )
    .bind(
      b.client_name ?? existing.client_name,
      b.client_position ?? existing.client_position,
      b.client_company ?? existing.client_company,
      b.photo_url ?? existing.photo_url,
      b.review_text ?? existing.review_text,
      b.project_slug ?? existing.project_slug,
      b.rating ?? existing.rating,
      b.is_published !== undefined ? (b.is_published ? 1 : 0) : existing.is_published,
      b.sort_order ?? existing.sort_order,
      id
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM testimonials WHERE id = ?").bind(id).first();
  return c.json({ ...row, is_published: !!row.is_published });
});

app.delete("/api/testimonials/:id", requireAuth, async (c) => {
  await c.env.DB.prepare("DELETE FROM testimonials WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

/* ---------------------------- Media upload (R2) ---------------------------- */
app.post("/api/upload", requireAuth, async (c) => {
  if (!c.env.MEDIA) {
    return c.json({ error: "R2 storage is not configured yet. Enable R2 in the Cloudflare dashboard, create the bucket, then uncomment the binding in wrangler.toml and redeploy." }, 501);
  }
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return c.json({ error: "No file uploaded" }, 400);

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" }
  });

  const publicUrl = c.env.MEDIA_PUBLIC_URL ? `${c.env.MEDIA_PUBLIC_URL}/${key}` : `/media/${key}`;
  return c.json({ key, url: publicUrl }, 201);
});

app.get("/media/:key{.+}", async (c) => {
  if (!c.env.MEDIA) return c.json({ error: "R2 storage is not configured" }, 501);
  const obj = await c.env.MEDIA.get(c.req.param("key"));
  if (!obj) return c.json({ error: "Not found" }, 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
});

/* ---------------------------- Site settings (stats, contact info) ---------------------------- */
app.get("/api/settings", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM site_settings").all();
  const obj = {};
  for (const row of results) obj[row.key] = row.value;
  return c.json(obj);
});

app.put("/api/settings", requireAuth, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const entries = Object.entries(b);
  for (const [key, value] of entries) {
    await c.env.DB.prepare(
      "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
      .bind(key, String(value))
      .run();
  }
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

const BACKUP_TABLES = [
  "projects", "services", "pricing_plans", "process_steps",
  "testimonials", "articles", "faqs", "project_images", "subscribers", "messages"
];

async function runBackup(env) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;

  const dump = {};
  for (const table of BACKUP_TABLES) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
    dump[table] = results;
  }

  const json = JSON.stringify(dump, null, 2);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const dateStr = new Date().toISOString().slice(0, 10);

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || "TAZECODE <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      subject: `Backup Database TAZECODE — ${dateStr}`,
      text: `Backup mingguan database TAZECODE tanggal ${dateStr}. File JSON terlampir berisi: ${BACKUP_TABLES.join(", ")}.\n\nSimpan email ini sebagai arsip — jika suatu saat data perlu dipulihkan, file JSON ini berisi seluruh isi tabel di atas.`,
      attachments: [{ filename: `tazecode-backup-${dateStr}.json`, content: base64 }]
    })
  }).catch(() => {});
}

export default {
  fetch: app.fetch,
  scheduled: async (_event, env, ctx) => {
    ctx.waitUntil(runBackup(env));
  }
};
