import type { DocumentData } from 'firebase/firestore';

export type CookiePolicy = {
  id: string;
  title: string;
  bodyHtml?: string;
  // Derived flags computed in normalize for convenience
  isActive?: boolean;
  // Timestamps for lifecycle
  archivedAt?: number | null;
  removedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type CookiePolicyCreateInput = {
  title: string;
  bodyHtml?: string;
};

export type CookiePolicyPatchInput = {
  title?: string;
  bodyHtml?: string;
  isActive?: boolean;
  archivedAt?: number | null;
  removedAt?: number | null;
};

export type RawCookiePolicyDoc = DocumentData & {
  title?: any;
  bodyHtml?: any;
  isActive?: any; // legacy boolean
  isArchived?: any; // legacy boolean
  archivedAt?: any;
  removedAt?: any;
  createdAt?: any;
  updatedAt?: any;
};
