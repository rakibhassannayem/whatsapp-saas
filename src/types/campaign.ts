import type { EntityId, Timestamp } from "./common";
import type { Customer, CustomerTag, Tag } from "./customer";

export type Campaign = {
  id: EntityId;
  name: string;
  message_body: string;
  audience_count?: number;
  status?: string;
  created_at?: Timestamp;
};

export type MessageTemplate = {
  id: EntityId;
  name: string;
  body: string;
  created_at?: Timestamp;
};

export type CampaignRecipient = {
  campaign_id: EntityId;
  customer_id: EntityId;
};

export type CampaignAudiencePageProps = {
  params: Promise<{ campaignId: string }>;
};

export type CampaignAudienceManagerProps = {
  campaignId: string;
  initialCustomers: Customer[];
  initialRecipients: CampaignRecipient[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
};

export type SendMessageManagerProps = {
  initialCampaigns: Campaign[];
  initialCustomers: Customer[];
  initialRecipients: CampaignRecipient[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
};

export type CampaignsManagerProps = {
  initialCampaigns: Campaign[];
  initialTemplates: MessageTemplate[];
};

export type TemplatesManagerProps = {
  initialTemplates: MessageTemplate[];
};
