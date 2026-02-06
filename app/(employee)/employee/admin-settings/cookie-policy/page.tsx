"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, Table, Button, Modal, Select, Badge, Switch } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAppSettingsStore } from '@/state/appSettingsStore';

type CookiePolicy = { id: string; title: string; bodyHtml?: string; createdAt?: number; updatedAt?: number; deletedAt?: number; isActive?: boolean };

export default function CookiePolicyPage() {
  const router = useRouter();
  const enabled = useAppSettingsStore((s) => s.settings.cookiePolicyEnabled ?? false);
  const setEnabled = useAppSettingsStore((s) => s.setCookiePolicyEnabled);
  const [policies, setPolicies] = useState<CookiePolicy[]>([]);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db(), 'cookie_policies'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: CookiePolicy[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({ id: d.id, title: data.title || '(Untitled)', bodyHtml: data.bodyHtml || '', createdAt: data.createdAt, updatedAt: data.updatedAt, deletedAt: data.deletedAt, isActive: !!data.isActive });
      });
      setPolicies(rows.filter((p) => !p.deletedAt));
    });
    return () => unsub();
  }, []);

  const activeId = useMemo(() => policies.find((p) => p.isActive)?.id || null, [policies]);

  const openSelectModal = () => {
    setSelectedId(activeId || (policies[0]?.id ?? null));
    setSelectOpen(true);
  };

  const saveActive = async () => {
    if (!selectedId) return;
    for (const p of policies) {
      const desired = p.id === selectedId;
      if ((p.isActive ?? false) !== desired) {
        await updateDoc(doc(db(), 'cookie_policies', p.id), { isActive: desired, updatedAt: Date.now() } as any);
      }
    }
    setSelectOpen(false);
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
            <div>
              <Title order={2} mb={4}>Cookie Policy</Title>
              <Text c="dimmed">Define your cookie disclosures and consent.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => router.push('/employee/admin-settings/cookie-policy/new')} disabled={!enabled}>New policy</Button>
            <Button variant="light" onClick={openSelectModal} disabled={!enabled}>Select active</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Website cookie policy</Text>
              <Text c="dimmed" size="sm">Toggle to enable/disable cookie policy on the public site.</Text>
            </div>
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.currentTarget.checked)}
              label={enabled ? 'Enabled' : 'Disabled'}
            />
          </Group>
        </Card>

        {enabled && (
          <Card withBorder>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Active</Table.Th>
                  <Table.Th>Updated</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {policies.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>{p.title}</Table.Td>
                    <Table.Td>{p.isActive ? <Badge variant="light" color="green">Active</Badge> : '—'}</Table.Td>
                    <Table.Td>{new Date(p.updatedAt || p.createdAt || 0).toLocaleString() || '—'}</Table.Td>
                  </Table.Tr>
                ))}
                {policies.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No cookie policies yet</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        <Modal opened={selectOpen} onClose={() => setSelectOpen(false)} title="Select active cookie policy" centered>
          <Stack>
            <Select
              data={policies.map((p) => ({ value: p.id, label: `${p.title} — ${new Date(p.updatedAt || p.createdAt || 0).toLocaleDateString()}` }))}
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
      </Stack>
    </EmployerAdminGate>
  );
}
