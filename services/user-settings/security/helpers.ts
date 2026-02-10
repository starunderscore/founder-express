import type { ChangePasswordInput, ChangePasswordResult } from './types';

export function validatePasswordChange(input: ChangePasswordInput): ChangePasswordResult {
  if (!input.email || !input.email.includes('@')) return { ok: false, reason: 'Valid email required' } as const;
  if (!input.currentPassword) return { ok: false, reason: 'Enter current password' } as const;
  if (!input.newPassword || input.newPassword.length < 6) return { ok: false, reason: 'Password must be at least 6 characters' } as const;
  if (typeof input.confirmPassword === 'string' && input.newPassword !== input.confirmPassword) return { ok: false, reason: 'Passwords do not match' } as const;
  if (input.newPassword === input.currentPassword) return { ok: false, reason: 'New password must be different' } as const;
  return { ok: true } as const;
}

