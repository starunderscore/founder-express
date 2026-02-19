export type GeneralSettings = {
  currency: string; // ISO currency code, e.g., USD
  gracePeriodDays: number; // >= 0, integer
  enforceTax: boolean; // auto-apply enabled taxes to new invoices
};

export type GeneralPatchInput = Partial<{
  currency: string | null | undefined;
  gracePeriodDays: number | string | null | undefined;
  enforceTax: boolean | null | undefined;
}>;

