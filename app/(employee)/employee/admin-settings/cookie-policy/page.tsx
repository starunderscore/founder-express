"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, Button, Modal, Select, Badge, Switch, Tabs, Menu } from '@mantine/core';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import PolicyRemoveModal from '@/components/privacy/PolicyRemoveModal';
import { IconCookie } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ensureDefaultCookiePolicy, listenCookiePolicies, listenCookiePolicyEnabled, setCookiePolicyEnabled, archiveCookiePolicy, removeCookiePolicy, setActiveCookiePolicy, type CookiePolicy as CookiePolicyRow } from '@/services/admin-settings/cookie-policy';
import { db } from '@/lib/firebase/client';
import { useAppSettingsStore } from '@/state/appSettingsStore';

type CookiePolicy = { id: string; title: string; bodyHtml?: string; createdAt?: number; updatedAt?: number; deletedAt?: number; isActive?: boolean };

export default function CookiePolicyPage() {
  const router = useRouter();
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [policies, setPolicies] = useState<CookiePolicyRow[]>([]);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<CookiePolicy | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let unsubRows: (() => void) | null = null;
    let unsubEnabled: (() => void) | null = null;
    (async () => {
      try { await ensureDefaultCookiePolicy(); } catch {}
      unsubRows = listenCookiePolicies((rows) => setPolicies(rows));
      unsubEnabled = listenCookiePolicyEnabled((flag) => setEnabled(flag ?? true));
    })();
    return () => { try { unsubRows && unsubRows(); } catch {} try { unsubEnabled && unsubEnabled(); } catch {} };
  }, []);

  // Listing handled by service listeners above

  const activeId = useMemo(() => policies.find((p) => p.isActive)?.id || null, [policies]);

  const openSelectModal = () => {
    const eligible = policies
      .filter((p) => !p.archivedAt && !p.removedAt)
      .slice()
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const fallback = eligible[0]?.id ?? null;
    setSelectedId(activeId || fallback);
    setSelectOpen(true);
  };

  const saveActive = async () => {
    if (!selectedId) return;
    // Enforce a single active policy: activate selected, deactivate others
    await setActiveCookiePolicy(selectedId);
    setSelectOpen(false);
    toast.show({ title: 'Saved', message: 'Active policy updated.', color: 'green' });
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
              <IconCookie size={20} />
              <div>
                <Title order={2} mb={4}>Cookie Policy</Title>
                <Text c="dimmed">Define your cookie disclosures and consent.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => router.push('/employee/admin-settings/cookie-policy/new')} disabled={!enabled}>New policy</Button>
            <Button variant="light" onClick={openSelectModal} disabled={!enabled}>Select active</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/admin-settings/cookie-policy">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/admin-settings/cookie-policy/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/admin-settings/cookie-policy/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Website cookie policy</Text>
              <Text c="dimmed" size="sm">Toggle to enable/disable cookie policy on the public site.</Text>
            </div>
            <Switch checked={enabled} onChange={async (e) => { const v = e.currentTarget.checked; try { await setCookiePolicyEnabled(v); toast.show({ title: 'Saved', message: `Cookie policy ${v ? 'enabled' : 'disabled'}.`, color: 'green' }); } catch (err: any) { toast.show({ title: 'Update failed', message: String(err?.message || err || 'Unknown error'), color: 'red' }); } }} label={enabled ? 'Enabled' : 'Disabled'} />
          </Group>
        </Card>

        {enabled && (
          <Card withBorder>
              <FirestoreDataTable
              collectionPath="eq_cookie_policies"
              columns={[
                { key: 'title', header: 'Title', render: (r: any) => (<Link href={`/employee/admin-settings/cookie-policy/client?id=${r.id}`} style={{ textDecoration: 'none' }}>{r.title || '(Untitled)'}</Link>) },
                { key: 'active', header: 'Active', width: 120, render: (r: any) => {
                  const row = policies.find((p) => p.id === r.id);
                  const isActive = !!row?.isActive;
                  return isActive ? <Badge variant="light" color="green">Active</Badge> : '—';
                } },
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
                      <Menu.Item component={Link as any} href="/employee/admin-settings/cookie-policy/client">Edit</Menu.Item>
                      <Menu.Item onClick={() => { setTarget(r); setConfirmArchive(true); }}>Deactivate</Menu.Item>
                      <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmRemove(true); }}>Remove</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                ) },
              ] as Column<any>[]}
              initialSort={{ field: 'updatedAt', direction: 'desc' }}
              clientFilter={(r: any) => !r.removedAt && !r.archivedAt}
              enableSelection={false}
              defaultPageSize={25}
              refreshKey={refreshKey}
            />
          </Card>
        )}

        <Modal opened={selectOpen} onClose={() => setSelectOpen(false)} title="Select active cookie policy" centered>
          <Stack>
            <Select
              data={policies
                .filter((p) => !p.archivedAt && !p.removedAt)
                .slice()
                .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
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

        <Modal opened={confirmArchive} onClose={() => setConfirmArchive(false)} title="Deactivate policy" centered>
          <Stack>
            <Text>Deactivate this policy? It will no longer be active.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await archiveCookiePolicy(target.id);
                setConfirmArchive(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Saved', message: 'Policy deactivated.', color: 'green' });
              }}>Deactivate</Button>
            </Group>
          </Stack>
        </Modal>

        <PolicyRemoveModal
          opened={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          policyTitle={target?.title || ''}
          onConfirm={async () => {
            if (!target) return;
            await removeCookiePolicy(target.id);
            setConfirmRemove(false); setTarget(null);
            setRefreshKey((k) => k + 1);
            toast.show({ title: 'Saved', message: 'Policy moved to Removed.', color: 'green' });
          }}
        />
      </Stack>
    </EmployerAdminGate>
  );
}
