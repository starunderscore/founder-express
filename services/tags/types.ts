import type { DocumentData } from 'firebase/firestore';

export type TagStatus = 'active' | 'archived' | 'removed';

export type Tag = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status?: TagStatus; // defaults to 'active'
  createdAt?: number;
};

export type TagCreateInput = {
  name: string;
  description?: string;
  color?: string;
};

export type TagPatchInput = {
  name?: string;
  description?: string; // blank string should clear description
  color?: string | null; // null or blank clears color
  status?: TagStatus; // generally managed via helpers
};

export type RawTagDoc = DocumentData & {
  name?: any;
  description?: any;
  color?: any;
  status?: any;
  createdAt?: any;
};

