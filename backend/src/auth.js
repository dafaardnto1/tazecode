// Lightweight auth: SHA-256 password hashing + HMAC-signed bearer tokens.
// No external JWT library needed — Workers expose Web Crypto natively.

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

const DAY = 24 * 60 * 60;

export async function signToken(payload, secret, expiresInSeconds = 7 * DAY) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const headerPart = b64url(JSON.stringify(header));
  const bodyPart = b64url(JSON.stringify(body));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerPart}.${bodyPart}`));
  return `${headerPart}.${bodyPart}.${b64url(sig)}`;
}

export async function verifyToken(token, secret) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, bodyPart, sigPart] = parts;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(b64urlDecodeToString(sigPart), (c) => c.charCodeAt(0)),
    new TextEncoder().encode(`${headerPart}.${bodyPart}`)
  );
  if (!valid) return null;
  const payload = JSON.parse(b64urlDecodeToString(bodyPart));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export async function requireAuth(c, next) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", payload);
  await next();
}
