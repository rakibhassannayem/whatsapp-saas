import "server-only";

import { getPlatformAdminServiceContext } from "@/lib/supabase/platform-admin";
import type { PlatformAdminBusiness } from "@/types/platform-admin";
import type { PlatformAdminAccount } from "@/types/platform-admin";

export async function getPlatformAdminAccounts() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  const { data: adminRows, error } = await context.serviceClient.rpc(
    "list_platform_admins",
  );
  if (error) return { status: "data-unavailable" as const };

  const rows = (adminRows ?? []) as {
    user_id: string;
    created_at: string;
    activated_at: string | null;
  }[];
  const accounts = await Promise.all(
    rows.map(async (row) => {
      const { data, error: userError } =
        await context.serviceClient.auth.admin.getUserById(row.user_id);
      if (userError || !data.user) return null;

      const bannedUntil = data.user.banned_until
        ? Date.parse(data.user.banned_until)
        : Number.NaN;
      const isSuspended = Number.isFinite(bannedUntil) && bannedUntil > Date.now();

      return {
        id: data.user.id,
        email: data.user.email ?? null,
        createdAt: row.created_at,
        status: isSuspended
          ? ("suspended" as const)
          : row.activated_at
            ? ("active" as const)
            : ("invitation pending" as const),
      };
    }),
  );

  if (accounts.some((account) => account === null)) {
    return { status: "auth-data-unavailable" as const };
  }

  return {
    status: "authorized" as const,
    currentUserId: context.user.id,
    accounts: accounts.filter((account): account is PlatformAdminAccount => account !== null),
  };
}

export async function getPlatformAdminBusinesses() {
  const context = await getPlatformAdminServiceContext();
  if (context.status !== "authorized") return context;

  const { data: businessRows, error: businessesError } =
    await context.serviceClient
      .from("businesses")
      .select("id, name, created_at, created_by")
      .order("created_at", { ascending: false });

  if (businessesError) return { status: "data-unavailable" as const };

  const { data: memberships, error: membershipsError } =
    await context.serviceClient
      .from("business_memberships")
      .select("business_id, user_id");

  if (membershipsError) return { status: "data-unavailable" as const };

  const [customersResult, campaignsResult, recipientsResult] = await Promise.all([
    context.serviceClient.from("customers").select("business_id"),
    context.serviceClient
      .from("campaigns")
      .select("id, business_id, name, status, created_at")
      .order("created_at", { ascending: false }),
    context.serviceClient.from("campaign_recipients").select("campaign_id"),
  ]);

  if (
    customersResult.error ||
    campaignsResult.error ||
    recipientsResult.error
  ) {
    return { status: "data-unavailable" as const };
  }

  const [plansResult, subscriptionsResult, paymentsResult] = await Promise.all([
    context.serviceClient
      .from("subscription_plans")
      .select("id, name, billing_period"),
    context.serviceClient
      .from("business_subscriptions")
      .select("id, business_id, plan_id, status, starts_at, expires_at, customer_limit, campaign_limit, monthly_message_limit, created_at")
      .order("created_at", { ascending: false }),
    context.serviceClient
      .from("subscription_payments")
      .select("id, business_id, package_name, amount, currency, status, paid_at, payment_reference, created_at")
      .order("created_at", { ascending: false }),
  ]);
  const subscriptionDataAvailable =
    !plansResult.error && !subscriptionsResult.error && !paymentsResult.error;

  const plansById = new Map(
    (plansResult.data ?? []).map((plan) => [plan.id, plan]),
  );
  const subscriptionByBusiness = new Map<
    string,
    PlatformAdminBusiness["subscription"]
  >();
  if (subscriptionDataAvailable) {
    for (const subscription of subscriptionsResult.data ?? []) {
      if (subscriptionByBusiness.has(subscription.business_id)) continue;
      const plan = plansById.get(subscription.plan_id);
      if (!plan) continue;
      subscriptionByBusiness.set(subscription.business_id, {
        id: subscription.id,
        planName: plan.name,
        billingPeriod: plan.billing_period as "monthly" | "yearly",
        status: subscription.status,
        startsAt: subscription.starts_at,
        expiresAt: subscription.expires_at,
        customerLimit: subscription.customer_limit,
        campaignLimit: subscription.campaign_limit,
        monthlyMessageLimit: subscription.monthly_message_limit,
      });
    }
  }

  const paymentsByBusiness = new Map<string, PlatformAdminBusiness["payments"]>();
  if (subscriptionDataAvailable) {
    for (const payment of paymentsResult.data ?? []) {
      const businessPayments = paymentsByBusiness.get(payment.business_id) ?? [];
      businessPayments.push({
        id: payment.id,
        packageName: payment.package_name,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paid_at,
        paymentReference: payment.payment_reference,
        createdAt: payment.created_at,
      });
      paymentsByBusiness.set(payment.business_id, businessPayments);
    }
  }

  const customerCounts = new Map<string, number>();
  for (const customer of customersResult.data) {
    customerCounts.set(
      customer.business_id,
      (customerCounts.get(customer.business_id) ?? 0) + 1,
    );
  }

  const audienceCounts = new Map<string, number>();
  for (const recipient of recipientsResult.data) {
    audienceCounts.set(
      recipient.campaign_id,
      (audienceCounts.get(recipient.campaign_id) ?? 0) + 1,
    );
  }

  const campaignsByBusiness = new Map<
    string,
    PlatformAdminBusiness["campaigns"]
  >();
  for (const campaign of campaignsResult.data) {
    const businessCampaigns = campaignsByBusiness.get(campaign.business_id) ?? [];
    businessCampaigns.push({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status ?? "draft",
      createdAt: campaign.created_at,
      audienceCount: audienceCounts.get(campaign.id) ?? 0,
    });
    campaignsByBusiness.set(campaign.business_id, businessCampaigns);
  }

  const userIds = [
    ...new Set([
      ...memberships.map(({ user_id }) => user_id),
      ...businessRows.flatMap((business) =>
        business.created_by ? [business.created_by] : [],
      ),
    ]),
  ];
  const profilesById = new Map<string, string | null>();
  const usersById = new Map<
    string,
    {
      email: string | null;
      status: "active" | "suspended";
      role: "platform_admin" | "business_user";
    }
  >();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await context.serviceClient
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) return { status: "data-unavailable" as const };
    for (const profile of profiles)
      profilesById.set(profile.id, profile.full_name);

    const userResults = await Promise.all(
      userIds.map(async (userId) => {
        const [authResult, adminResult] = await Promise.all([
          context.serviceClient.auth.admin.getUserById(userId),
          context.serviceClient.rpc("is_platform_admin_user", {
            target_user_id: userId,
          }),
        ]);

        if (authResult.error || !authResult.data.user) {
          return { userId, error: "auth" as const };
        }
        if (adminResult.error) {
          return { userId, error: "role-check" as const };
        }

        const user = authResult.data.user;
        const bannedUntil = user.banned_until
          ? Date.parse(user.banned_until)
          : Number.NaN;

        return {
          userId,
          error: null,
          email: user.email ?? null,
          status:
            Number.isFinite(bannedUntil) && bannedUntil > Date.now()
              ? ("suspended" as const)
              : ("active" as const),
          role: adminResult.data
            ? ("platform_admin" as const)
            : ("business_user" as const),
        };
      }),
    );

    const failedUserLookup = userResults.find(
      (result) => result.error !== null,
    );
    if (failedUserLookup?.error === "role-check") {
      return { status: "role-check-unavailable" as const };
    }
    if (failedUserLookup) {
      return { status: "auth-data-unavailable" as const };
    }

    for (const result of userResults) {
      if (result.error) continue;
      usersById.set(result.userId, {
        email: result.email,
        status: result.status,
        role: result.role,
      });
    }
  }

  const membershipsByBusiness = new Map<string, Set<string>>();
  for (const membership of memberships) {
    const memberIds =
      membershipsByBusiness.get(membership.business_id) ?? new Set();
    memberIds.add(membership.user_id);
    membershipsByBusiness.set(membership.business_id, memberIds);
  }

  function getUserSummary(userId: string) {
    const user = usersById.get(userId);
    if (!user) return null;
    return {
      id: userId,
      fullName: profilesById.get(userId) ?? null,
      email: user.email,
      status: user.status,
      role: user.role,
    };
  }

  const businesses: PlatformAdminBusiness[] = businessRows.map((business) => ({
    id: business.id,
    name: business.name,
    createdAt: business.created_at,
    ownerUserId: business.created_by,
    owner: business.created_by ? getUserSummary(business.created_by) : null,
    customerCount: customerCounts.get(business.id) ?? 0,
    campaigns: campaignsByBusiness.get(business.id) ?? [],
    subscription: subscriptionByBusiness.get(business.id) ?? null,
    payments: paymentsByBusiness.get(business.id) ?? [],
    users: [...(membershipsByBusiness.get(business.id) ?? [])].flatMap(
      (userId) => {
        const user = getUserSummary(userId);
        return user ? [user] : [];
      },
    ),
  }));

  return {
    status: "authorized" as const,
    businesses,
    subscriptionDataAvailable,
  };
}
