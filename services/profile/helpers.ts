import type { EmployeeProfile, EmployeeProfilePatch } from './types';

export function normalizeEmployee(id: string, raw: any): EmployeeProfile {
  const email = typeof raw?.email === 'string' ? raw.email : undefined;
  const name = typeof raw?.name === 'string' ? raw.name : undefined;
  const displayName = typeof raw?.displayName === 'string' ? raw.displayName : undefined;
  const dateOfBirth = typeof raw?.dateOfBirth === 'string' ? raw.dateOfBirth : undefined;
  return { id, email, name, displayName, dateOfBirth };
}

export function buildEmployeePatch(input: EmployeeProfilePatch): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') out.name = input.name.trim();
  if (typeof input.displayName === 'string') out.displayName = input.displayName.trim();
  if (typeof input.dateOfBirth === 'string') out.dateOfBirth = input.dateOfBirth;
  return out;
}
