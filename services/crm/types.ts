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
  emails?: any[];
  addresses?: any[];
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

// Extended CRM shapes used in UI (migrated from state/crmStore)
export type LeadSource =
  | 'no-source'
  | 'Website'
  | 'Referral'
  | 'Paid Ads'
  | 'Social'
  | 'Event'
  | 'Import'
  | 'Waiting List'
  | 'Other';

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByPhotoURL?: string;
};

export type Email = {
  id: string;
  email: string;
  label?: string;
  kind?: 'Personal' | 'Work';
  notes?: Note[];
};

export type Phone = {
  id: string;
  number: string;
  label?: string;
  ext?: string;
  addressId?: string;
  kind?: 'Personal' | 'Work';
  notes?: Note[];
};

export type Address = {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  isHQ?: boolean;
  phones?: Phone[];
};

export type Contact = {
  id: string;
  name: string;
  title?: string;
  createdAt?: number;
  deletedAt?: number;
  tags?: string[];
  emails?: Email[];
  phones?: Phone[];
  addresses?: Address[];
  notes?: Note[];
  isBlocked?: boolean;
  isArchived?: boolean;
  doNotContact?: boolean;
};
