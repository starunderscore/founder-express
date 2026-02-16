export type NewsletterStatus = 'Draft' | 'Scheduled' | 'Sent';

export type Newsletter = {
  id: string;
  subject: string;
  body: string;
  status: NewsletterStatus;
  recipients: number;
  scheduledAt?: number | null;
  sentAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type NewsletterCreateInput = {
  subject: string;
  body: string;
  status?: NewsletterStatus; // defaults to Draft
};

export type NewsletterPatchInput = Partial<Omit<Newsletter, 'id' | 'createdAt' | 'updatedAt' | 'recipients'>> & {
  recipients?: number;
};

