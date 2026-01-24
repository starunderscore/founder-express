import { redirect } from 'next/navigation';

export default function EmployeesIndexPage() {
  redirect('/employee/employees/manage');
}
