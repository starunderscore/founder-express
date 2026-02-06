"use client";
import VendorNotesPage from '@/app/(employee)/employee/crm/vendor/[id]/notes/page';

export default function VendorsVendorNotesPage(props: { params: { id: string } }) {
  return VendorNotesPage(props as any);
}
