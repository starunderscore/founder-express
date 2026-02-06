"use client";
import VendorContactDetailPage from '@/app/(employee)/employee/crm/vendor/contact/[id]/page';

export default function VendorsVendorContactPage(props: { params: { id: string } }) {
  return VendorContactDetailPage(props as any);
}
