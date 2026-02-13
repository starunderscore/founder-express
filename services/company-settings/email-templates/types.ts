export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt?: number;
  updatedAt?: number;
  archivedAt?: number | null;
  deletedAt?: number | null;
};

export type EmailTemplateCreateInput = {
  name: string;
  subject: string;
  body: string;
};

export type EmailTemplatePatchInput = Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>;

