import { updateUserProfile } from '@/lib/firebase/auth';

export async function updateDisplayName(displayName: string): Promise<void> {
  await updateUserProfile({ displayName });
}

