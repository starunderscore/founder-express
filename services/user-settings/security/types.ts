export type ChangePasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
};

export type ChangePasswordResult = {
  ok: true;
} | {
  ok: false;
  reason: string;
};

