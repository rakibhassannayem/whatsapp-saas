export type PlatformAdminAccount = {
  id: string;
  email: string | null;
  createdAt: string;
  status: "active" | "suspended" | "invitation pending";
};

export type PlatformAdminBusinessUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  status: "active" | "suspended";
  role: "platform_admin" | "business_user";
};

export type PlatformAdminBusiness = {
  id: string;
  name: string;
  createdAt: string;
  ownerUserId: string | null;
  owner: PlatformAdminBusinessUser | null;
  customerCount: number;
  campaigns: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    audienceCount: number;
  }[];
  subscription: {
    id: string;
    planName: string;
    billingPeriod: "monthly" | "yearly";
    status: string;
    startsAt: string;
    expiresAt: string | null;
    customerLimit: number | null;
    campaignLimit: number | null;
    monthlyMessageLimit: number | null;
  } | null;
  payments: {
    id: string;
    packageName: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    paymentReference: string | null;
    createdAt: string;
  }[];
  users: PlatformAdminBusinessUser[];
};
