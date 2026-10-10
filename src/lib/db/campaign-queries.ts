import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignRecipients, campaigns, messageTemplates } from "@/lib/db/schema";

export async function getBusinessCampaigns(businessId: string) {
  const rows = await db.select({
    id: campaigns.id,
    name: campaigns.name,
    messageBody: campaigns.messageBody,
    status: campaigns.status,
    createdAt: campaigns.createdAt,
  }).from(campaigns).where(eq(campaigns.businessId, businessId)).orderBy(desc(campaigns.createdAt));

  const recipientRows = rows.length
    ? await db.select({ campaignId: campaignRecipients.campaignId })
      .from(campaignRecipients)
      .where(inArray(campaignRecipients.campaignId, rows.map((row) => row.id)))
    : [];
  const counts = new Map<string, number>();
  for (const recipient of recipientRows) counts.set(recipient.campaignId, (counts.get(recipient.campaignId) ?? 0) + 1);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    message_body: row.messageBody,
    status: row.status,
    created_at: row.createdAt.toISOString(),
    audience_count: counts.get(row.id) ?? 0,
  }));
}

export async function getBusinessMessageTemplates(businessId: string) {
  const rows = await db.select({
    id: messageTemplates.id,
    name: messageTemplates.name,
    body: messageTemplates.body,
    createdAt: messageTemplates.createdAt,
  }).from(messageTemplates).where(eq(messageTemplates.businessId, businessId)).orderBy(desc(messageTemplates.createdAt));
  return rows.map((row) => ({ id: row.id, name: row.name, body: row.body, created_at: row.createdAt.toISOString() }));
}

export async function getBusinessCampaign(businessId: string, campaignId: string) {
  const [row] = await db.select({
    id: campaigns.id,
    name: campaigns.name,
    messageBody: campaigns.messageBody,
    status: campaigns.status,
  }).from(campaigns).where(and(eq(campaigns.businessId, businessId), eq(campaigns.id, campaignId))).limit(1);
  return row ? { id: row.id, name: row.name, message_body: row.messageBody, status: row.status } : null;
}

export async function getCampaignRecipients(campaignId: string) {
  const rows = await db.select({ campaign_id: campaignRecipients.campaignId, customer_id: campaignRecipients.customerId })
    .from(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId));
  return rows;
}

export async function getBusinessCampaignRecipients(businessId: string) {
  const rows = await db.select({
    campaign_id: campaignRecipients.campaignId,
    customer_id: campaignRecipients.customerId,
  }).from(campaignRecipients).innerJoin(
    campaigns,
    eq(campaignRecipients.campaignId, campaigns.id),
  ).where(eq(campaigns.businessId, businessId));
  return rows;
}

