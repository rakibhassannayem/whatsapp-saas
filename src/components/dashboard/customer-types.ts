export type Customer = {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type CustomerTag = {
  customer_id: string;
  tag_id: string;
};
