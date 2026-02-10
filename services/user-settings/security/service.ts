import type { ChangePasswordInput, ChangePasswordResult } from './types';
import { validatePasswordChange } from './helpers';
import { reauthWithPassword, updateUserPassword } from '@/lib/firebase/auth';

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const v = validatePasswordChange(input);
  if (!v.ok) return v;
  try {
    await reauthWithPassword(input.email, input.currentPassword);
    await updateUserPassword(input.newPassword);
    return { ok: true } as const;
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Failed to update password' } as const;
  }
}

