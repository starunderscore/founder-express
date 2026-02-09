"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, Tabs, Menu, Modal, Button, Alert } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { restorePrivacyPolicy, deletePrivacyPolicy, listenPrivacyPolicyEnabled } from '@/services/admin-settings/privacy-policy';
import PolicyDeletePermanentModal from '@/components/privacy/PolicyDeletePermanentModal';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function PrivacyPolicyRemovedPage() {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState<any | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    const unsub = listenPrivacyPolicyEnabled((flag) => setEnabled(flag ?? true));
    return () => unsub();
  }, []);
  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconShieldCheck size={20} />
              <div>
                <Title order={2} mb={4}>Privacy Policy</Title>
                <Text c="dimmed">Removed client privacy policies.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'removed'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/admin-settings/privacy-policy">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/admin-settings/privacy-policy/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/admin-settings/privacy-policy/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {!enabled && (
          <Alert color="yellow">
            Privacy policies are currently disabled. Go to the
            {' '}<Link href="/employee/admin-settings/privacy-policy">Active</Link>{' '}tab and turn on “Website privacy policy” to manage removed items.
          </Alert>
        )}

        {enabled && (
          <Card withBorder>
            <FirestoreDataTable
            collectionPath="privacy_policies"
            columns={[
              { key: 'title', header: 'Title', render: (r: any) => (<Link href="/employee/admin-settings/privacy-policy/client" style={{ textDecoration: 'none' }}>{r.title || '(Untitled)'}</Link>) },
              { key: 'actions', header: '', width: 1, render: (r: any) => (
                <Menu withinPortal position="bottom-end" shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="More actions">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="19" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component={Link as any} href="/employee/admin-settings/privacy-policy/client">Edit</Menu.Item>
                    <Menu.Item onClick={() => { setTarget(r); setConfirmRestore(true); }}>Restore</Menu.Item>
                    <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmDelete(true); }}>Delete permanently</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )},
            ] as Column<any>[]}
            initialSort={{ field: 'updatedAt', direction: 'desc' }}
            clientFilter={(r: any) => !!r.deletedAt && (r.type || 'client') === 'client'}
            enableSelection={false}
            defaultPageSize={25}
            refreshKey={refreshKey}
          />
          </Card>
        )}

        <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restore policy" centered>
          <Stack>
            <Text>Restore this policy back to Archive?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await restorePrivacyPolicy(target.id);
                setConfirmRestore(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Saved', message: 'Policy restored to Archive.', color: 'green' });
              }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <PolicyDeletePermanentModal
          opened={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          policyTitle={target?.title || ''}
          onConfirm={async () => {
            if (!target) return;
            await deletePrivacyPolicy(target.id);
            setConfirmDelete(false); setTarget(null);
            setRefreshKey((k) => k + 1);
            toast.show({ title: 'Deleted', message: 'Policy permanently deleted.', color: 'green' });
          }}
        />
      </Stack>
    </EmployerAdminGate>
  );
}
