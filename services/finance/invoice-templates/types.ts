export type InvoiceTemplateItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceTemplate = {
  id: string;
  name: string;
  items: InvoiceTemplateItem[];
  taxIds: string[];
  archiveAt: number | null;
  removedAt: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type InvoiceTemplateCreateInput = {
  name: string;
  items: InvoiceTemplateItem[];
  taxIds: string[];
};

export type InvoiceTemplatePatchInput = Partial<Omit<InvoiceTemplate, 'id'>>;

