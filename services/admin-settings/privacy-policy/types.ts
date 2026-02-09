import type { DocumentData } from 'firebase/firestore';

export type PrivacyPolicy = {
  id: string;
  title: string;
  type: 'client' | string;
  bodyHtml?: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
  deletedAt?: number | null;
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
};

export type RawPrivacyPolicyDoc = DocumentData & {
  title?: any;
  type?: any;
  bodyHtml?: any;
  isActive?: any;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any;
};

