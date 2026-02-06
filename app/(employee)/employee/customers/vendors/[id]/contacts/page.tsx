"use client";
import VendorContactsPage from '@/app/(employee)/employee/crm/vendor/[id]/contacts/page';

export default function VendorsVendorContactsPage(props: { params: { id: string } }) {
  return VendorContactsPage(props as any);
}
