/**
 * Script to create or promote a user to admin role.
 * Run from project root with:
 *   npm run admin:create           # Interactive: create or promote admin
 *   npm run admin:list             # List all users and their roles
 *   npm run admin:promote -- email@x.com   # Promote existing user to admin
 */

import { fileURLToPath } from "url";
import path from "path";
import { readFileSync } from "fs";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim().replace(/\r$/, "");
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = val;
  }
} catch {
  console.error("Could not load .env.local — make sure it exists.");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

// Use pg (already in dependencies) + drizzle node-postgres adapter
const { default: pg } = await import("pg");
const { drizzle } = await import("drizzle-orm/node-postgres");
const { eq } = await import("drizzle-orm");
const { default: bcrypt } = await import("bcryptjs");
const { pgTable, uuid, text, timestamp } = await import("drizzle-orm/pg-core");

// Define users table inline (avoids server-only import issues)
const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const args = process.argv.slice(2);
const promoteMode = args.includes("--promote");
const listMode = args.includes("--list");

async function listUsers() {
  const allUsers = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .orderBy(users.createdAt);

  console.log("\n📋 All users in database:\n");
  console.log("Email".padEnd(42) + "Role".padEnd(12) + "ID");
  console.log("─".repeat(90));
  for (const user of allUsers) {
    const roleColored =
      user.role === "admin"
        ? `\x1b[32m${user.role}\x1b[0m     ` // green
        : user.role;
    console.log(user.email.padEnd(42) + roleColored.padEnd(12) + user.id);
  }
  console.log(`\nTotal: ${allUsers.length} user(s)\n`);
}

async function promoteUser(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  if (!user) {
    console.error(`\n❌ No user found with email: ${email}\n`);
    process.exit(1);
  }
  if (user.role === "admin") {
    console.log(`\n✅ User "${email}" is already an admin. No changes made.\n`);
    return;
  }
  await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  console.log(`\n✅ User "${email}" has been promoted to admin!`);
  console.log(`   They can now log in at /admin with their existing credentials.\n`);
}

async function createAdmin() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log("\n🛡️  Platform Admin Account Setup\n");

  const email = (await ask("Admin email: ")).trim().toLowerCase().replace(/\r$/, "");
  if (!email.includes("@")) {
    console.error("❌ Invalid email format.");
    rl.close();
    process.exit(1);
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    if (existing.role === "admin") {
      console.log(`\n✅ "${email}" is already an admin. No changes made.\n`);
      rl.close();
      return;
    }
    const confirm = await ask(
      `\nUser "${email}" exists with role "${existing.role}".\nPromote to admin? (y/n): `
    );
    if (confirm.trim().toLowerCase() !== "y") {
      console.log("\nAborted.\n");
      rl.close();
      return;
    }
    await db.update(users).set({ role: "admin" }).where(eq(users.id, existing.id));
    console.log(`\n✅ "${email}" has been promoted to admin!`);
    console.log(`   Login at: /admin\n`);
    rl.close();
    return;
  }

  const password = (await ask("New password (min 8 chars): ")).replace(/\r$/, "");
  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters.");
    rl.close();
    process.exit(1);
  }
  const confirmPw = (await ask("Confirm password: ")).replace(/\r$/, "");
  if (password !== confirmPw) {
    console.error("❌ Passwords do not match.");
    rl.close();
    process.exit(1);
  }

  const name = (await ask("Display name (optional, press Enter to skip): ")).trim().replace(/\r$/, "") || null;
  rl.close();

  const hashed = await bcrypt.hash(password, 12);
  const [newUser] = await db
    .insert(users)
    .values({ email, password: hashed, role: "admin", name })
    .returning({ id: users.id, email: users.email });

  console.log(`\n✅ Admin account created successfully!`);
  console.log(`   Email: ${newUser.email}`);
  console.log(`   ID:    ${newUser.id}`);
  console.log(`   Login at: /admin\n`);
}

try {
  if (listMode) {
    await listUsers();
  } else if (promoteMode) {
    const emailArg = args[args.indexOf("--promote") + 1];
    if (!emailArg) {
      console.error("\nUsage: npm run admin:promote -- email@example.com\n");
      process.exit(1);
    }
    await promoteUser(emailArg);
  } else {
    await createAdmin();
  }
} finally {
  await pool.end();
}
