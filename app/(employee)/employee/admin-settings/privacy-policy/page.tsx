"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, Button, Modal, Select, Badge, Switch, Menu, Tabs } from '@mantine/core';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ensureDefaultPrivacyPolicy, listenPrivacyPolicies, listenPrivacyPolicyEnabled, setActiveClientPolicy, setPrivacyPolicyEnabled, removePrivacyPolicy, archivePrivacyPolicy, type PrivacyPolicy } from '@/services/admin-settings/privacy-policy';
import PolicyRemoveModal from '@/components/privacy/PolicyRemoveModal';
import { useToast } from '@/components/ToastProvider';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<PrivacyPolicy | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let unsubPolicies: (() => void) | null = null;
    let unsubEnabled: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try { await ensureDefaultPrivacyPolicy(); } catch {}
      if (cancelled) return;
      unsubPolicies = listenPrivacyPolicies((rows) => setPolicies(rows.filter((p) => !p.deletedAt)));
      unsubEnabled = listenPrivacyPolicyEnabled((flag) => setEnabled(flag ?? true));
    })();
    return () => { cancelled = true; try { unsubPolicies && unsubPolicies(); } catch {} try { unsubEnabled && unsubEnabled(); } catch {} };
  }, []);

  const activeId = useMemo(() => policies.find((p) => (p.type || 'client') === 'client' && p.isActive)?.id || null, [policies]);

  const openSelectModal = () => {
    setSelectedId(activeId || (policies.find((p) => (p.type || 'client') === 'client')?.id ?? null));
    setSelectOpen(true);
  };

  const saveActive = async () => {
    if (!selectedId) return;
    try {
      await setActiveClientPolicy(selectedId);
      setSelectOpen(false);
      toast.show({ title: 'Saved', message: 'Active policy updated.', color: 'green' });
    } catch (e: any) {
      toast.show({ title: 'Update failed', message: String(e?.message || e || 'Unknown error'), color: 'red' });
    }
  };

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
                <Text c="dimmed">Terms and conditions for client portal signup.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={openSelectModal} disabled={!enabled}>Select active</Button>
            <Button variant="light" onClick={() => router.push('/employee/admin-settings/privacy-policy/new')} disabled={!enabled}>New policy</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/admin-settings/privacy-policy">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/admin-settings/privacy-policy/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/admin-settings/privacy-policy/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Website privacy policy</Text>
              <Text c="dimmed" size="sm">Toggle to enable/disable the built-in privacy policy.</Text>
            </div>
            <Switch
              checked={enabled}
              onChange={async (e) => {
                const v = e.currentTarget.checked;
                try {
                  await setPrivacyPolicyEnabled(v);
                  toast.show({ title: 'Saved', message: `Privacy policy ${v ? 'enabled' : 'disabled'}.`, color: 'green' });
                } catch (err: any) {
                  toast.show({ title: 'Update failed', message: String(err?.message || err || 'Unknown error'), color: 'red' });
                }
              }}
              label={enabled ? 'Enabled' : 'Disabled'}
            />
          </Group>
        </Card>

        {enabled && (
          <>
            <Card withBorder>
              <FirestoreDataTable
                collectionPath="ep_privacy_policies"
                columns={[
                  { key: 'title', header: 'Title', render: (r: any) => (<Link href="/employee/admin-settings/privacy-policy/client" style={{ textDecoration: 'none' }}>{r.title || '(Untitled)'}</Link>) },
                  { key: 'active', header: 'Active', width: 120, render: (r: any) => (r.isActive ? <Badge variant="light" color="green">Active</Badge> : '—') },
                  { key: 'actions', header: '', width: 1, render: (r: any) => (
                    <Menu withinPortal position="bottom-end" shadow="md" width={180}>
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
                        <Menu.Item onClick={() => { setTarget(r); setConfirmArchive(true); }}>Archive</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmRemove(true); }}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )},
                ] as Column<any>[]}
                initialSort={{ field: 'updatedAt', direction: 'desc' }}
                clientFilter={(r: any) => !r.deletedAt && (r.type || 'client') === 'client' && !!r.isActive}
                enableSelection={false}
                defaultPageSize={25}
                refreshKey={refreshKey}
              />
            </Card>
          </>
        )}

        <Modal opened={selectOpen} onClose={() => setSelectOpen(false)} title="Select active client policy" centered>
          <Stack>
            <Select
              data={policies
                .filter((p) => (p.type || 'client') === 'client')
                .map((p) => ({ value: p.id, label: `${p.title} — ${new Date(p.updatedAt || p.createdAt || 0).toLocaleDateString()}` }))}
              value={selectedId}
              onChange={(v) => setSelectedId(v)}
              placeholder="Choose a policy"
              allowDeselect={false}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setSelectOpen(false)}>Cancel</Button>
              <Button onClick={saveActive} disabled={!selectedId}>Save</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive policy" centered>
          <Stack>
            <Text>Archive this policy? It will no longer be active.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await archivePrivacyPolicy(target.id);
                setConfirmArchive(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Saved', message: 'Policy archived.', color: 'green' });
              }}>Archive</Button>
            </Group>
          </Stack>
        </Modal>

        <PolicyRemoveModal
          opened={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          policyTitle={target?.title || ''}
          onConfirm={async () => {
            if (!target) return;
            await removePrivacyPolicy(target.id);
            setConfirmRemove(false); setTarget(null);
            setRefreshKey((k) => k + 1);
            toast.show({ title: 'Saved', message: 'Policy moved to Removed.', color: 'green' });
          }}
        />
      </Stack>
    </EmployerAdminGate>
  );
}
