"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, ActionIcon, Table, Menu, Modal } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ensureDefaultAdminSettings, listenSystemValues, updateBuiltinSystemValue, rowsFromSettings } from '@/services/admin-settings/system-values';
import { useToast } from '@/components/ToastProvider';
import { useEffect, useState } from 'react';

type Row = { id: string; key: string; value: string; builtin?: boolean; hint?: string };

export default function SystemValuesPage() {
  const router = useRouter();
  const toast = useToast();
  // Deletion disabled on System values page; only edits allowed
  // Seed UI with built-in rows so the page never appears empty
  const [rows, setRows] = useState<Row[]>(() => rowsFromSettings({ websiteUrl: '', websiteName: '', env: [] } as any) as Row[]);
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try { await ensureDefaultAdminSettings(); } catch {}
      unsub = listenSystemValues((r) => setRows(r as Row[]), {
        onError: () => {
          // Show built-ins even if listener fails (e.g., permissions)
          setRows(rowsFromSettings({ websiteUrl: '', websiteName: '', env: [] } as any) as Row[]);
        },
      });
    })();
    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [builtinKey, setBuiltinKey] = useState<'WEBSITE_URL'>('WEBSITE_URL');
  const [valueInput, setValueInput] = useState('');

  const resetForm = () => {
    setBuiltinKey('WEBSITE_URL');
    setValueInput('');
  };
  const openEdit = (r: Row) => {
    if (r.key !== 'WEBSITE_URL' && r.key !== 'WEBSITE_NAME') return; // only edit built-ins here
    setBuiltinKey((r.key as any) || 'WEBSITE_URL');
    setValueInput(r.value);
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBuiltinSystemValue(builtinKey, valueInput);
      toast.show({ title: 'Saved', message: `${builtinKey} updated.`, color: 'green' });
      setModalOpen(false);
    } catch (err: any) {
      toast.show({ title: 'Update failed', message: String(err?.message || err || 'Unknown error'), color: 'red' });
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
              <IconAdjustments size={20} />
              <div>
                <Title order={2} mb={4}>System values</Title>
                <Text c="dimmed">Branding and app values (e.g., Website URL) stored in your system.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Card withBorder>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Key</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Hint</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.key}</Table.Td>
                  <Table.Td>{r.value || '—'}</Table.Td>
                  <Table.Td><Text c="dimmed" size="sm">{r.hint || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                    <Menu.Dropdown>
                      {(r.key === 'WEBSITE_URL' || r.key === 'WEBSITE_NAME') && (
                        <Menu.Item onClick={() => openEdit(r)}>Edit</Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
                </Table.Tr>
              ))}
              {rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed">No variables yet</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={'Edit variable'} centered>
          <form onSubmit={onSubmit}>
            <Stack>
              {/* Key */}
              <Text fw={600} size="sm">Key</Text>
              <Text size="sm" c="dimmed">{builtinKey}</Text>
              {/* Value */}
              <Text fw={600} size="sm" mt={6}>Value</Text>
              <TextInput
                placeholder={builtinKey === 'WEBSITE_URL' ? 'https://www.example.com' : 'Acme Inc.'}
                value={valueInput}
                onChange={(e) => setValueInput(e.currentTarget.value)}
                required
                maxLength={builtinKey === 'WEBSITE_URL' ? 200 : 60}
                rightSection={<Text size="xs" c="dimmed">{(valueInput || '').length}/{builtinKey === 'WEBSITE_URL' ? 200 : 60}</Text>}
                rightSectionWidth={56}
              />
              <Group justify="flex-end" mt="xs">
                <Button variant="default" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </EmployerAdminGate>
  );
}
