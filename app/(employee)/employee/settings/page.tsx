import { redirect } from 'next/navigation';

export default function EmployeeSettingsRedirect() {
  redirect('/employee/company-settings');
}
