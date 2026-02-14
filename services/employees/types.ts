export type Employee = {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  permissionIds: string[];
  isAdmin?: boolean;
  isArchived?: boolean | null;
  deletedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
};

export type EmployeeCreateInput = {
  name: string;
  email: string;
  roleIds?: string[];
  permissionIds?: string[];
  isAdmin?: boolean;
};

export type EmployeePatchInput = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>;

