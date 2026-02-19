export type VendorContactNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByPhotoURL?: string;
};

export type VendorContact = {
  id: string;
  name: string;
  title?: string;
  createdAt?: number;
  deletedAt?: number;
  tags?: string[];
  emails?: any[];
  phones?: any[];
  addresses?: any[];
  notes?: VendorContactNote[];
  isBlocked?: boolean;
  isArchived?: boolean;
  doNotContact?: boolean;
};

export type VendorContactPatch = Partial<Omit<VendorContact, 'id' | 'createdAt'>>;

