import { describe, it, expect } from '@jest/globals';
import { validatePasswordChange } from '../../../../services/user-settings/security';

describe('services/user-settings/security helpers', () => {
  it('validates inputs correctly', () => {
    expect(validatePasswordChange({ email: '', currentPassword: '', newPassword: '' } as any)).toEqual({ ok: false, reason: 'Valid email required' });
    expect(validatePasswordChange({ email: 'a@b.com', currentPassword: '', newPassword: '' } as any)).toEqual({ ok: false, reason: 'Enter current password' });
    expect(validatePasswordChange({ email: 'a@b.com', currentPassword: 'x', newPassword: '123' } as any)).toEqual({ ok: false, reason: 'Password must be at least 6 characters' });
    expect(validatePasswordChange({ email: 'a@b.com', currentPassword: 'x', newPassword: '123456', confirmPassword: '000000' } as any)).toEqual({ ok: false, reason: 'Passwords do not match' });
    expect(validatePasswordChange({ email: 'a@b.com', currentPassword: 'abcdef', newPassword: 'abcdef' } as any)).toEqual({ ok: false, reason: 'New password must be different' });
    expect(validatePasswordChange({ email: 'a@b.com', currentPassword: 'oldpass', newPassword: 'newpass', confirmPassword: 'newpass' })).toEqual({ ok: true });
  });
});

