export type ImportRow = {
  full_name: string;
  phone_e164: string;
  email: string | null;
};

export type ImportedCustomer = ImportRow & { id: string };

export type ImportCompletion = {
  error: string | null;
  message?: string;
};

export type InvalidRow = { rowNumber: number; reasons: string[] };

export type ColumnMapping = { field: string; source: string };
