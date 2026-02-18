import type { DocumentData } from 'firebase/firestore';

export type CRMLifecycle = 'active' | 'archived' | 'removed';

export type CRMRecordType = 'customer' | 'vendor';

export type CRMRecord = {
  id: string;
  type: CRMRecordType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  sourceDetail?: string;
  tags?: string[];
  ownerId?: string;
  createdAt?: number;
  // Lifecycle flags stored in Firestore
  isArchived?: boolean;
  deletedAt?: number; // present when moved to Removed
};

export type CRMCreateInput = {
  type: CRMRecordType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  sourceDetail?: string;
  tags?: string[];
  ownerId?: string | null;
};

export type CRMPatchInput = {
  type?: CRMRecordType;
  name?: string;
  email?: string | null; // null or blank clears
  phone?: string | null; // null or blank clears
  company?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  tags?: string[];
  ownerId?: string | null;
  // lifecycle fields are managed via helpers/firestore functions
  isBlocked?: boolean;
  isArchived?: boolean;
  deletedAt?: number | null;
  // complex arrays (pass-through)
  notes?: any[];
  phones?: any[];
};

export type RawCRMDoc = DocumentData & {
  type?: any;
  name?: any;
  email?: any;
  phone?: any;
  company?: any;
  source?: any;
  sourceDetail?: any;
  tags?: any;
  ownerId?: any;
  createdAt?: any;
  isArchived?: any;
  deletedAt?: any;
};
