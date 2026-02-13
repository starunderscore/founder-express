export type SystemEmailId = 'password_reset' | 'verify_email';

export type SystemEmail = {
  id: SystemEmailId;
  subject: string;
  body: string;
  updatedAt?: number;
};

export type SystemEmailUpsertInput = {
  subject: string;
  body: string;
};

