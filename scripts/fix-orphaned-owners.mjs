/**
 * Migration script: fix orphaned business ownership records
 * after switching from Supabase Auth to Auth.js
 *
 * Usage: node scripts/fix-orphaned-owners.mjs
 */

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

// Find all user IDs referenced in businesses/memberships but not in users table
const orphanQuery = await pool.query(`
  SELECT DISTINCT b.created_by AS orphan_id
  FROM businesses b
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.created_by)
  UNION
  SELECT DISTINCT bm.user_id AS orphan_id
  FROM business_memberships bm
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = bm.user_id)
`);

if (orphanQuery.rows.length === 0) {
  console.log("\n✅ No orphaned user IDs found. All business records are correctly linked.\n");
  await pool.end();
  process.exit(0);
}

console.log(`\n⚠️  Found ${orphanQuery.rows.length} orphaned user ID(s):\n`);

for (const { orphan_id } of orphanQuery.rows) {
  console.log(`Orphaned ID: ${orphan_id}`);

  // Show which businesses/memberships reference this orphan
  const bizRows = await pool.query(
    `SELECT id, name FROM businesses WHERE created_by = $1`,
    [orphan_id]
  );
  const memRows = await pool.query(
    `SELECT business_id FROM business_memberships WHERE user_id = $1`,
    [orphan_id]
  );

  console.log(`  → In businesses.created_by: ${bizRows.rows.map(r => r.name).join(", ") || "none"}`);
  console.log(`  → In business_memberships: ${memRows.rows.length} row(s)`);
}

console.log("\n📋 All users in the system:\n");
const allUsers = await pool.query(`SELECT id, email, role FROM users ORDER BY created_at`);
console.table(allUsers.rows);

// Interactive: map each orphan to a real user
import readline from "readline";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

let fixCount = 0;
for (const { orphan_id } of orphanQuery.rows) {
  console.log(`\nOrphan ID: ${orphan_id}`);
  const email = (await ask(`Map this to which user email (or press Enter to skip): `)).trim().toLowerCase().replace(/\r$/, "");
  if (!email) {
    console.log("Skipped.");
    continue;
  }

  const matchUser = allUsers.rows.find((u) => u.email === email);
  if (!matchUser) {
    console.log(`❌ No user found with email: ${email}. Skipping.`);
    continue;
  }

  const confirm = await ask(`Map ${orphan_id} → ${matchUser.id} (${email})? (y/n): `);
  if (confirm.trim().toLowerCase() !== "y") {
    console.log("Skipped.");
    continue;
  }

  const r1 = await pool.query(
    `UPDATE businesses SET created_by = $1 WHERE created_by = $2`,
    [matchUser.id, orphan_id]
  );
  const r2 = await pool.query(
    `UPDATE business_memberships SET user_id = $1 WHERE user_id = $2`,
    [matchUser.id, orphan_id]
  );

  console.log(`✅ Fixed: businesses updated=${r1.rowCount}, memberships updated=${r2.rowCount}`);
  fixCount++;
}

rl.close();

if (fixCount > 0) {
  console.log(`\n✅ Migration complete. ${fixCount} orphan(s) fixed.\n`);
} else {
  console.log(`\nNo changes made.\n`);
}

await pool.end();
