import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
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
    unique("customers_business_id_id_key").on(table.businessId, table.id),
    unique("customers_business_id_phone_e164_key").on(
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
    unique("tags_business_id_id_key").on(table.businessId, table.id),
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
    unique("campaigns_business_id_name_key").on(table.businessId, table.name),
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
    unique("message_templates_business_id_name_key").on(
      table.businessId,
      table.name,
    ),
  ],
);

export const platformAdmins = pgTable("platform_admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    billingPeriod: text("billing_period")
      .$type<"monthly" | "yearly">()
      .notNull(),
    priceAmount: numeric("price_amount", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("BDT"),
    customerLimit: integer("customer_limit"),
    campaignLimit: integer("campaign_limit"),
    monthlyMessageLimit: integer("monthly_message_limit"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("subscription_plans_billing_period_unique").on(table.billingPeriod),
    check(
      "subscription_plans_billing_period_check",
      sql`${table.billingPeriod} IN ('monthly', 'yearly')`,
    ),
    check(
      "subscription_plans_price_amount_check",
      sql`${table.priceAmount} IS NULL OR ${table.priceAmount} >= 0`,
    ),
    check(
      "subscription_plans_customer_limit_check",
      sql`${table.customerLimit} IS NULL OR ${table.customerLimit} >= 0`,
    ),
    check(
      "subscription_plans_campaign_limit_check",
      sql`${table.campaignLimit} IS NULL OR ${table.campaignLimit} >= 0`,
    ),
    check(
      "subscription_plans_monthly_message_limit_check",
      sql`${table.monthlyMessageLimit} IS NULL OR ${table.monthlyMessageLimit} >= 0`,
    ),
  ],
);

export const businessSubscriptions = pgTable(
  "business_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),
    status: text("status")
      .$type<"trialing" | "active" | "expired" | "cancelled" | "past_due">()
      .notNull()
      .default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    customerLimit: integer("customer_limit"),
    campaignLimit: integer("campaign_limit"),
    monthlyMessageLimit: integer("monthly_message_limit"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("business_subscriptions_business_created_idx").on(
      table.businessId,
      table.createdAt,
    ),
    check(
      "business_subscriptions_status_check",
      sql`${table.status} IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')`,
    ),
    check(
      "business_subscriptions_customer_limit_check",
      sql`${table.customerLimit} IS NULL OR ${table.customerLimit} >= 0`,
    ),
    check(
      "business_subscriptions_campaign_limit_check",
      sql`${table.campaignLimit} IS NULL OR ${table.campaignLimit} >= 0`,
    ),
    check(
      "business_subscriptions_monthly_message_limit_check",
      sql`${table.monthlyMessageLimit} IS NULL OR ${table.monthlyMessageLimit} >= 0`,
    ),
  ],
);

export const subscriptionPayments = pgTable(
  "subscription_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(
      () => businessSubscriptions.id,
      { onDelete: "set null" },
    ),
    packageName: text("package_name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("BDT"),
    status: text("status")
      .$type<"pending" | "paid" | "failed" | "refunded">()
      .notNull()
      .default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paymentReference: text("payment_reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscription_payments_business_paid_idx").on(
      table.businessId,
      table.paidAt,
    ),
    check("subscription_payments_amount_check", sql`${table.amount} >= 0`),
    check(
      "subscription_payments_status_check",
      sql`${table.status} IN ('pending', 'paid', 'failed', 'refunded')`,
    ),
  ],
);

