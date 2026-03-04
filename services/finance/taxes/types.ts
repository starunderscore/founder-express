export type Tax = {
  id: string;
  name: string;
  rate: number; // percent, 0..100
  enabled: boolean;
  archiveAt: number | null;
  removedAt: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type TaxCreateInput = {
  name: string;
  rate: number;
  enabled?: boolean;
};

export type TaxPatchInput = Partial<Omit<Tax, 'id'>>;

