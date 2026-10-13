import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessMemberships,
  businessSubscriptions,
  businesses,
  campaignRecipients,
  campaigns,
  customers,
  profiles,
  subscriptionPayments,
  subscriptionPlans,
  users,
} from "@/lib/db/schema";
import { getPlatformAdminServiceContext } from "@/lib/platform-admin";
import type { PlatformAdminAccount, PlatformAdminBusiness } from "@/types/platform-admin";

export async function getPlatformAdminAccounts() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  try {
    const adminRows = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "admin"));

    return {
      status: "authorized" as const,
      currentUserId: context.user.id,
      accounts: adminRows.map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
        status: "active" as const,
      })),
    };
  } catch {
    return { status: "data-unavailable" as const };
  }
}

export async function getPlatformAdminBusinesses() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  try {
    const [businessRows, memberships, customerRows, campaignRows, subscriptionRows, paymentRows] = await Promise.all([
      db.select({ id: businesses.id, name: businesses.name, createdAt: businesses.createdAt, createdBy: businesses.createdBy })
        .from(businesses).orderBy(desc(businesses.createdAt)),
      db.select({ businessId: businessMemberships.businessId, userId: businessMemberships.userId }).from(businessMemberships),
      db.select({ businessId: customers.businessId }).from(customers),
      db.select({ id: campaigns.id, businessId: campaigns.businessId, name: campaigns.name, status: campaigns.status, createdAt: campaigns.createdAt })
        .from(campaigns).orderBy(desc(campaigns.createdAt)),
      db.select({
        id: businessSubscriptions.id,
        businessId: businessSubscriptions.businessId,
        planName: subscriptionPlans.name,
        billingPeriod: subscriptionPlans.billingPeriod,
        status: businessSubscriptions.status,
        startsAt: businessSubscriptions.startsAt,
        expiresAt: businessSubscriptions.expiresAt,
        customerLimit: businessSubscriptions.customerLimit,
        campaignLimit: businessSubscriptions.campaignLimit,
        monthlyMessageLimit: businessSubscriptions.monthlyMessageLimit,
      })
        .from(businessSubscriptions)
        .innerJoin(subscriptionPlans, eq(businessSubscriptions.planId, subscriptionPlans.id))
        .orderBy(desc(businessSubscriptions.createdAt)),
      db.select({
        id: subscriptionPayments.id,
        businessId: subscriptionPayments.businessId,
        packageName: subscriptionPayments.packageName,
        amount: subscriptionPayments.amount,
        currency: subscriptionPayments.currency,
        status: subscriptionPayments.status,
        paidAt: subscriptionPayments.paidAt,
        paymentReference: subscriptionPayments.paymentReference,
        createdAt: subscriptionPayments.createdAt,
      })
        .from(subscriptionPayments)
        .orderBy(desc(subscriptionPayments.createdAt)),
    ]);

    const subscriptionsByBusiness = new Map<string, PlatformAdminBusiness["subscription"]>();
    for (const sub of subscriptionRows) {
      if (!subscriptionsByBusiness.has(sub.businessId)) {
        subscriptionsByBusiness.set(sub.businessId, {
          id: sub.id,
          planName: sub.planName,
          billingPeriod: sub.billingPeriod,
          status: sub.status,
          startsAt: sub.startsAt.toISOString(),
          expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
          customerLimit: sub.customerLimit,
          campaignLimit: sub.campaignLimit,
          monthlyMessageLimit: sub.monthlyMessageLimit,
        });
      }
    }

    const paymentsByBusiness = new Map<string, PlatformAdminBusiness["payments"]>();
    for (const payment of paymentRows) {
      const items = paymentsByBusiness.get(payment.businessId) ?? [];
      items.push({
        id: payment.id,
        packageName: payment.packageName,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
        paymentReference: payment.paymentReference,
        createdAt: payment.createdAt.toISOString(),
      });
      paymentsByBusiness.set(payment.businessId, items);
    }

    const recipientRows = campaignRows.length
      ? await db.select({ campaignId: campaignRecipients.campaignId }).from(campaignRecipients)
        .where(inArray(campaignRecipients.campaignId, campaignRows.map((campaign) => campaign.id)))
      : [];

    const customerCounts = new Map<string, number>();
    for (const row of customerRows) customerCounts.set(row.businessId, (customerCounts.get(row.businessId) ?? 0) + 1);
    const audienceCounts = new Map<string, number>();
    for (const row of recipientRows) audienceCounts.set(row.campaignId, (audienceCounts.get(row.campaignId) ?? 0) + 1);
    const campaignsByBusiness = new Map<string, PlatformAdminBusiness["campaigns"]>();
    for (const campaign of campaignRows) {
      const items = campaignsByBusiness.get(campaign.businessId) ?? [];
      items.push({ id: campaign.id, name: campaign.name, status: campaign.status, createdAt: campaign.createdAt.toISOString(), audienceCount: audienceCounts.get(campaign.id) ?? 0 });
      campaignsByBusiness.set(campaign.businessId, items);
    }

    const userIds = [...new Set([
      ...memberships.map((row) => row.userId),
      ...businessRows.map((row) => row.createdBy),
    ])];

    const profilesById = new Map<string, string | null>();
    if (userIds.length) {
      const profileRows = await db.select({ id: profiles.id, fullName: profiles.fullName })
        .from(profiles).where(inArray(profiles.id, userIds));
      for (const profile of profileRows) profilesById.set(profile.id, profile.fullName);
    }

    const userRows = userIds.length
      ? await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];

    const usersById = new Map<string, { email: string | null; status: "active" | "suspended"; role: "platform_admin" | "business_user" }>();
    for (const row of userRows) {
      usersById.set(row.id, {
        email: row.email,
        status: "active",
        role: row.role === "admin" ? "platform_admin" : "business_user",
      });
    }

    const membershipsByBusiness = new Map<string, Set<string>>();
    for (const membership of memberships) {
      const ids = membershipsByBusiness.get(membership.businessId) ?? new Set<string>();
      ids.add(membership.userId);
      membershipsByBusiness.set(membership.businessId, ids);
    }

    function getUserSummary(userId: string) {
      const user = usersById.get(userId);
      if (!user) return null;
      return { id: userId, fullName: profilesById.get(userId) ?? null, email: user.email, status: user.status, role: user.role };
    }

    const result: PlatformAdminBusiness[] = businessRows.map((business) => ({
      id: business.id,
      name: business.name,
      createdAt: business.createdAt.toISOString(),
      ownerUserId: business.createdBy,
      owner: getUserSummary(business.createdBy),
      customerCount: customerCounts.get(business.id) ?? 0,
      campaigns: campaignsByBusiness.get(business.id) ?? [],
      subscription: subscriptionsByBusiness.get(business.id) ?? null,
      payments: paymentsByBusiness.get(business.id) ?? [],
      users: [...(membershipsByBusiness.get(business.id) ?? [])].flatMap((userId) => {
        const user = getUserSummary(userId);
        return user ? [user] : [];
      }),
    }));

    return { status: "authorized" as const, businesses: result, subscriptionDataAvailable: true };
  } catch {
    return { status: "data-unavailable" as const };
  }
}
