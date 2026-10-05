import type { EntityId, NullableString, Timestamp } from "./common";

export type Customer = {
  id: EntityId;
  full_name: string;
  phone_e164: string;
  email: NullableString;
  created_at?: Timestamp;
};

export type Tag = {
  id: EntityId;
  name: string;
  created_at?: Timestamp;
};

export type CustomerTag = {
  customer_id: EntityId;
  tag_id: EntityId;
};

export type TagsManagerProps = {
  initialTags: Tag[];
  initialCustomers: Customer[];
  initialCustomerTags: CustomerTag[];
};
