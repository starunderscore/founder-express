export type RecurringConfig = { interval: 'day' | 'week' | 'month' | 'year'; intervalCount?: number };

export type Price = {
  id: string;
  currency: string;
  unitAmount: number;
  type: 'one_time' | 'recurring';
  recurring?: RecurringConfig;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  prices: Price[];
  defaultType?: 'one_time' | 'recurring';
  archiveAt: number | null;
  removedAt: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type ProductCreateInput = {
  name: string;
  description?: string;
  active?: boolean;
  defaultType?: 'one_time' | 'recurring';
  prices?: Omit<Price, 'id'>[];
};

export type ProductPatchInput = Partial<Omit<Product, 'id' | 'prices'>> & {
  prices?: Omit<Price, 'id'>[];
};

