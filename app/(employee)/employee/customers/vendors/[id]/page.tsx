"use client";
import VendorDetailPage from '@/app/(employee)/employee/crm/vendor/[id]/page';

export default function VendorsVendorPage(props: { params: { id: string } }) {
  return VendorDetailPage(props as any);
}
