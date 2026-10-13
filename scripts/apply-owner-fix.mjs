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

const ORPHAN_ID = "5936930e-6642-4e6e-9cc9-412a4048b9c9"; // old Supabase ID
const REAL_ID   = "673497b4-abd7-47a8-a651-853f89380d24"; // test@gmail.com new Auth.js ID

console.log(`\nFixing orphaned records...`);
console.log(`  Old ID: ${ORPHAN_ID}`);
console.log(`  New ID: ${REAL_ID} (test@gmail.com)\n`);

const r1 = await pool.query(
  `UPDATE businesses SET created_by = $1 WHERE created_by = $2`,
  [REAL_ID, ORPHAN_ID]
);
console.log(`✅ businesses.created_by updated: ${r1.rowCount} row(s)`);

const r2 = await pool.query(
  `UPDATE business_memberships SET user_id = $1 WHERE user_id = $2`,
  [REAL_ID, ORPHAN_ID]
);
console.log(`✅ business_memberships.user_id updated: ${r2.rowCount} row(s)`);

// Verify
const verify = await pool.query(`
  SELECT b.id, b.name, b.created_by, u.email AS creator_email
  FROM businesses b
  LEFT JOIN users u ON u.id = b.created_by
  ORDER BY b.created_at
`);
console.log("\n=== BUSINESSES (after fix) ===");
console.table(verify.rows);

await pool.end();
console.log("\n✅ Done! Refresh the admin panel.\n");
