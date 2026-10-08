export type PlatformAdminBusiness = {
  id: string;
  name: string;
  createdAt: string;
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
  users: {
    id: string;
    fullName: string | null;
    email: string | null;
    status: "active" | "suspended";
    role: "platform_admin" | "business_user";
  }[];
};
