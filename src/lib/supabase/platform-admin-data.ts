import "server-only";

import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessMemberships, businesses, campaigns, campaignRecipients, customers, profiles } from "@/lib/db/schema";
import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import type { PlatformAdminAccount, PlatformAdminBusiness } from "@/types/platform-admin";

export async function getPlatformAdminAccounts() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  const { data: adminRows, error } = await context.serviceClient.rpc("list_platform_admins");
  if (error) return { status: "data-unavailable" as const };

  const rows = (adminRows ?? []) as { user_id: string; created_at: string; activated_at: string | null }[];
  const accounts = await Promise.all(rows.map(async (row) => {
    const { data, error: userError } = await context.serviceClient.auth.admin.getUserById(row.user_id);
    if (userError || !data.user) return null;
    const bannedUntil = data.user.banned_until ? Date.parse(data.user.banned_until) : Number.NaN;
    const isSuspended = Number.isFinite(bannedUntil) && bannedUntil > Date.now();
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      createdAt: row.created_at,
      status: isSuspended ? ("suspended" as const) : row.activated_at ? ("active" as const) : ("invitation pending" as const),
    };
  }));

  if (accounts.some((account) => account === null)) return { status: "auth-data-unavailable" as const };
  return {
    status: "authorized" as const,
    currentUserId: context.user.id,
    accounts: accounts.filter((account): account is PlatformAdminAccount => account !== null),
  };
}

export async function getPlatformAdminBusinesses() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  try {
    const [businessRows, memberships, customerRows, campaignRows] = await Promise.all([
      db.select({ id: businesses.id, name: businesses.name, createdAt: businesses.createdAt, createdBy: businesses.createdBy })
        .from(businesses).orderBy(desc(businesses.createdAt)),
      db.select({ businessId: businessMemberships.businessId, userId: businessMemberships.userId }).from(businessMemberships),
      db.select({ businessId: customers.businessId }).from(customers),
      db.select({ id: campaigns.id, businessId: campaigns.businessId, name: campaigns.name, status: campaigns.status, createdAt: campaigns.createdAt })
        .from(campaigns).orderBy(desc(campaigns.createdAt)),
    ]);

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

    const userResults = await Promise.all(userIds.map(async (userId) => {
      const [authResult, adminResult] = await Promise.all([
        context.serviceClient.auth.admin.getUserById(userId),
        context.serviceClient.rpc("is_platform_admin_user", { target_user_id: userId }),
      ]);
      if (authResult.error || !authResult.data.user) return { userId, error: "auth" as const };
      if (adminResult.error) return { userId, error: "role-check" as const };
      const user = authResult.data.user;
      const bannedUntil = user.banned_until ? Date.parse(user.banned_until) : Number.NaN;
      return {
        userId,
        error: null,
        email: user.email ?? null,
        status: Number.isFinite(bannedUntil) && bannedUntil > Date.now() ? ("suspended" as const) : ("active" as const),
        role: adminResult.data ? ("platform_admin" as const) : ("business_user" as const),
      };
    }));

    const failedUserLookup = userResults.find((row) => row.error !== null);
    if (failedUserLookup?.error === "role-check") return { status: "role-check-unavailable" as const };
    if (failedUserLookup) return { status: "auth-data-unavailable" as const };

    const usersById = new Map<string, { email: string | null; status: "active" | "suspended"; role: "platform_admin" | "business_user" }>();
    for (const row of userResults) {
      if (row.error) continue;
      usersById.set(row.userId, { email: row.email, status: row.status, role: row.role });
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
      subscription: null,
      payments: [],
      users: [...(membershipsByBusiness.get(business.id) ?? [])].flatMap((userId) => {
        const user = getUserSummary(userId);
        return user ? [user] : [];
      }),
    }));

    return { status: "authorized" as const, businesses: result, subscriptionDataAvailable: false };
  } catch {
    return { status: "data-unavailable" as const };
  }
}
