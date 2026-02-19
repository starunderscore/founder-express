"use client";
import { Group, Title, Badge, ActionIcon } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { useRouter } from 'next/navigation';

type ContactLike = {
  id: string;
  name?: string;
  title?: string;
  doNotContact?: boolean;
  isArchived?: boolean;
  deletedAt?: number;
  emails?: any[];
  phones?: any[];
  addresses?: any[];
};

export default function VendorContactHeader({
  vendorId,
  vendorName,
  contact,
  current,
  baseContact,
  backHref,
  rightSlot,
}: {
  vendorId: string;
  vendorName?: string;
  contact: ContactLike;
  current: 'overview' | 'notes' | 'actions';
  baseContact: string; // e.g., '/employee/customers/vendors/contact' or '/employee/crm/vendor/contact'
  backHref: string; // e.g., `/employee/customers/vendors/${vendorId}/contacts`
  rightSlot?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(backHref)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            {vendorName && (
              <Group gap={6} align="center">
                <Title order={6} style={{ margin: 0 }}>{vendorName}</Title>
                <Badge color="orange" variant="filled">Vendor</Badge>
              </Group>
            )}
            <Group gap="xs" align="center">
              <Title order={2} style={{ lineHeight: 1 }}>{contact.name || 'Contact'}</Title>
              <Badge color="grape" variant="filled">Contact</Badge>
              {contact.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
            </Group>
          </div>
        </Group>
        {rightSlot && (<Group>{rightSlot}</Group>)}
      </Group>

      <Group justify="space-between" mb="md" align="center">
        <div>
          {contact.title && (<Title order={6} style={{ margin: 0 }}>{contact.title}</Title>)}
        </div>
        <Group gap="xs">
          {(contact.emails?.length || 0) > 0 && <Badge variant="light">{contact.emails!.length} email{contact.emails!.length === 1 ? '' : 's'}</Badge>}
          {(contact.phones?.length || 0) > 0 && <Badge variant="light">{contact.phones!.length} phone{contact.phones!.length === 1 ? '' : 's'}</Badge>}
          {(contact.addresses?.length || 0) > 0 && <Badge variant="light">{contact.addresses!.length} address{contact.addresses!.length === 1 ? '' : 'es'}</Badge>}
        </Group>
      </Group>

      <RouteTabs
        value={current}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `${baseContact}/${contact.id}` },
          { value: 'notes', label: 'Notes', href: `${baseContact}/${contact.id}/notes` },
          { value: 'actions', label: 'Actions', href: `${baseContact}/${contact.id}/actions` },
        ]}
      />
    </>
  );
}
