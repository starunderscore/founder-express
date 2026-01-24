import { redirect } from 'next/navigation';

export default function OldEmailSettingsRedirect() {
  redirect('/employee/company-settings/email');
}
