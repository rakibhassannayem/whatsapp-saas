import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // This UUID will be connected to the selected auth user table later.
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "businesses_name_check",
      sql`char_length(trim(${table.name})) BETWEEN 1 AND 120`,
    ),
  ],
);

export const profiles = pgTable("profiles", {
  // This UUID will be connected to the selected auth user table later.
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const businessMemberships = pgTable(
  "business_memberships",
  {
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    // This UUID will be connected to the selected auth user table later.
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.businessId, table.userId] }),
    index("business_memberships_user_id_idx").on(table.userId),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phoneE164: text("phone_e164").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "customers_full_name_check",
      sql`char_length(trim(${table.fullName})) BETWEEN 1 AND 120`,
    ),
    check(
      "customers_phone_e164_check",
      sql`${table.phoneE164} ~ '^\\+[1-9][0-9]{1,14}$'`,
    ),
    unique("customers_business_id_id_unique").on(table.businessId, table.id),
    unique("customers_business_phone_unique").on(
      table.businessId,
      table.phoneE164,
    ),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "tags_name_check",
      sql`char_length(trim(${table.name})) BETWEEN 1 AND 50`,
    ),
    unique("tags_business_id_id_unique").on(table.businessId, table.id),
    uniqueIndex("tags_business_name_unique").on(
      table.businessId,
      sql`lower(${table.name})`,
    ),
  ],
);

export const customerTags = pgTable(
  "customer_tags",
  {
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.customerId, table.tagId] }),
    foreignKey({
      name: "customer_tags_business_id_customer_id_fkey",
      columns: [table.businessId, table.customerId],
      foreignColumns: [customers.businessId, customers.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "customer_tags_business_id_tag_id_fkey",
      columns: [table.businessId, table.tagId],
      foreignColumns: [tags.businessId, tags.id],
    }).onDelete("cascade"),
    index("customer_tags_tag_lookup_idx").on(table.businessId, table.tagId),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    messageBody: text("message_body").notNull(),
    status: text("status")
      .$type<"draft" | "scheduled" | "sending" | "completed" | "failed" | "cancelled">()
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "campaigns_name_check",
      sql`char_length(trim(${table.name})) BETWEEN 1 AND 100`,
    ),
    check(
      "campaigns_message_body_check",
      sql`char_length(trim(${table.messageBody})) > 0`,
    ),
    check(
      "campaigns_status_check",
      sql`${table.status} IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')`,
    ),
    unique("campaigns_business_name_unique").on(table.businessId, table.name),
  ],
);

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.customerId] })],
);

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "message_templates_name_check",
      sql`char_length(trim(${table.name})) BETWEEN 1 AND 100`,
    ),
    check(
      "message_templates_body_check",
      sql`char_length(trim(${table.body})) > 0`,
    ),
    unique("message_templates_business_name_unique").on(
      table.businessId,
      table.name,
    ),
  ],
);
