import type { DocumentData } from 'firebase/firestore';

export type PrivacyPolicy = {
  id: string;
  title: string;
  type: 'client' | string;
  bodyHtml?: string;
  isActive?: boolean; // UI indicator for active client policy
  archiveAt?: number | null;
  removedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type PrivacyPolicyCreateInput = {
  title: string;
  bodyHtml?: string;
  type?: 'client' | string;
};

export type PrivacyPolicyPatchInput = {
  title?: string;
  bodyHtml?: string;
  isActive?: boolean;
  archiveAt?: number | null;
  removedAt?: number | null;
};

export type RawPrivacyPolicyDoc = DocumentData & {
  title?: any;
  type?: any;
  bodyHtml?: any;
  isActive?: any;
  archiveAt?: any;
  removedAt?: any;
  createdAt?: any;
  updatedAt?: any;
};
