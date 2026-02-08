import type { DocumentData } from 'firebase/firestore';

export type Role = {
  id: string;
  name: string;
  description?: string;
  permissionIds: string[];
  isArchived?: boolean;
  deletedAt?: number;
  createdAt?: number;
};

export type RoleStatus = 'active' | 'archived' | 'removed';

export type RoleCreateInput = {
  name: string;
  description?: string;
  permissionIds: string[];
};

export type RolePatchInput = {
  name?: string;
  description?: string; // blank string should clear description
  permissionIds?: string[];
};

export type RawRoleDoc = DocumentData & {
  name?: string;
  description?: string;
  permissionIds?: any;
  isArchived?: any;
  deletedAt?: any;
  createdAt?: any;
};

