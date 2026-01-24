import { redirect } from 'next/navigation';

export default function OldConfigurationSettingsRedirect() {
  redirect('/employee/company-settings/configuration');
}
