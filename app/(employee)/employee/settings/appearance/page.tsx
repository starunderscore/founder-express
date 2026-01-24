import { redirect } from 'next/navigation';

export default function OldAppearanceSettingsRedirect() {
  redirect('/employee/user-settings/appearance');
}
