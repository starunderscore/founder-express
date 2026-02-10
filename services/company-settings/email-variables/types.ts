export type EmailVar = {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt?: number;
  archivedAt?: number | null;
  deletedAt?: number | null;
};

export type EmailVarCreateInput = {
  key: string;
  value: string;
  description?: string;
};

export type EmailVarPatchInput = Partial<Omit<EmailVar, 'id' | 'createdAt'>>;

