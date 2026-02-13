export type Newsbar = {
  enabled: boolean;
  primaryHtml: string;
  secondaryHtml: string;
  updatedAt?: number;
  updatedBy?: string;
};

export type NewsbarUpsertInput = Pick<Newsbar, 'enabled' | 'primaryHtml' | 'secondaryHtml'> & { updatedBy?: string };

