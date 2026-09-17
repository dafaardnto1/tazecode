#!/usr/bin/env node
// Self-serve admin password reset — no need to ask anyone for help.
// Usage: node scripts/reset-password.js <new-password> [username]
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const newPassword = (process.argv[2] || "").trim();
const username = (process.argv[3] || "admin").trim();

if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters.\nUsage: node scripts/reset-password.js <new-password> [username]");
  process.exit(1);
}

const hash = createHash("sha256").update(newPassword).digest("hex");
const sql = `UPDATE admin_users SET password_hash = '${hash}' WHERE username = '${username.replace(/'/g, "''")}';`;

const tmpFile = join(tmpdir(), `tazecode-reset-${Date.now()}.sql`);
writeFileSync(tmpFile, sql, "utf8");

console.log(`Resetting password for "${username}"...`);
try {
  execSync(`npx wrangler d1 execute tazecode-db --remote --file="${tmpFile}"`, { stdio: "inherit" });
  console.log(`\nDone. New login:\n  username: ${username}\n  password: ${newPassword}\n`);
} finally {
  try { unlinkSync(tmpFile); } catch { /* ignore */ }
}
