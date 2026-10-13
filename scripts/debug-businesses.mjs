import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const t = line.trim().replace(/\r$/, "");
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const pg = await import("pg");
const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });

// Show ALL users
const r1 = await pool.query(`SELECT id, email, role, created_at FROM users ORDER BY created_at`);
console.log("=== ALL USERS ===");
console.table(r1.rows);

// The orphaned business owner ID
const orphanId = "5936930e-6642-4e6e-9cc9-412a4048b9c9";
const testEmail = "test@gmail.com";

// Check if test@gmail.com exists in users
const r2 = await pool.query(`SELECT id, email, role FROM users WHERE email = $1`, [testEmail]);
console.log(`\n=== test@gmail.com in users table ===`);
console.table(r2.rows);

// What we need to do: update businesses.created_by and business_memberships.user_id
// from orphanId to the real test@gmail.com user ID
if (r2.rows.length > 0) {
  const realUserId = r2.rows[0].id;
  console.log(`\n✅ test@gmail.com found with ID: ${realUserId}`);
  console.log(`❌ Orphaned ID (old Supabase): ${orphanId}`);
  console.log(`\nRun this to fix:\n`);
  console.log(`UPDATE businesses SET created_by = '${realUserId}' WHERE created_by = '${orphanId}';`);
  console.log(`UPDATE business_memberships SET user_id = '${realUserId}' WHERE user_id = '${orphanId}';`);
} else {
  console.log(`\n⚠️  test@gmail.com NOT found in users table!`);
  console.log(`The user with ID ${orphanId} doesn't exist in the new auth system.`);
}

await pool.end();
