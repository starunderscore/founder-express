"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, ActionIcon, Table, Menu, Modal, Select, Badge } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { useMemo, useState } from 'react';

type Row = { id: string; key: string; value: string; builtin?: boolean; hint?: string };

export default function SystemValuesPage() {
  const router = useRouter();
  const settings = useAppSettingsStore((s) => s.settings);
  const setWebsiteUrl = useAppSettingsStore((s) => s.setWebsiteUrl);
  const setWebsiteName = useAppSettingsStore((s) => (s as any).setWebsiteName);
  const addEnvVar = useAppSettingsStore((s) => s.addEnvVar);
  const updateEnvVar = useAppSettingsStore((s) => s.updateEnvVar);
  // Deletion disabled on System values page; only edits allowed

  const rows: Row[] = useMemo(() => {
    const urlRow: Row = { id: 'builtin-website-url', key: 'WEBSITE_URL', value: settings.websiteUrl || '', builtin: true, hint: 'Primary site URL' };
    const nameRow: Row = { id: 'builtin-website-name', key: 'WEBSITE_NAME', value: (settings as any).websiteName || '', builtin: true, hint: 'Brand name shown in UI/emails' };
    return [urlRow, nameRow, ...(settings.env || [])];
  }, [settings.websiteUrl, (settings as any).websiteName, settings.env]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [type, setType] = useState<'builtin' | 'custom'>('custom');
  const [builtinKey, setBuiltinKey] = useState<'WEBSITE_URL'>('WEBSITE_URL');
  const [id, setId] = useState<string>('');
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [hintInput, setHintInput] = useState('');

  const resetForm = () => {
    setMode('create');
    setType('custom');
    setBuiltinKey('WEBSITE_URL');
    setId('');
    setKeyInput('');
    setValueInput('');
    setHintInput('');
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (r: Row) => {
    setMode('edit');
    setType(r.builtin ? 'builtin' : 'custom');
    setBuiltinKey((r.key as any) || 'WEBSITE_URL');
    setId(r.id);
    setKeyInput(r.key);
    setValueInput(r.value);
    setHintInput(r.hint || '');
    setModalOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'builtin') {
      if (builtinKey === 'WEBSITE_URL') setWebsiteUrl(valueInput);
      else if (builtinKey === 'WEBSITE_NAME') setWebsiteName(valueInput);
      setModalOpen(false);
      return;
    }
    if (mode === 'create') {
      if (!keyInput.trim()) return;
      addEnvVar({ key: keyInput.trim(), value: valueInput, hint: hintInput || undefined });
    } else {
      updateEnvVar(id, { key: keyInput.trim(), value: valueInput, hint: hintInput || undefined });
    }
    setModalOpen(false);
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
              <Title order={2} mb={4}>System values</Title>
              <Text c="dimmed">Branding and app values (e.g., Website URL) stored in your system.</Text>
            </div>
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
                  <Table.Td>
                    {r.key} {r.builtin && <Badge ml={6} size="xs" variant="light">built-in</Badge>}
                  </Table.Td>
                  <Table.Td>{r.value || '—'}</Table.Td>
                  <Table.Td><Text c="dimmed" size="sm">{r.hint || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openEdit(r)}>Edit</Menu.Item>
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

        <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={mode === 'create' ? 'Add variable' : 'Edit variable'} centered>
          <form onSubmit={onSubmit}>
            <Stack>
              {mode === 'create' ? (
                <Select label="Type" data={[{ value: 'custom', label: 'Custom' }, { value: 'builtin', label: 'Built-in' }]} value={type} onChange={(v: any) => setType(v)} />
              ) : null}
              {type === 'builtin' ? (
                <>
                  {/* Key */}
                  <Text fw={600} size="sm">Key</Text>
                  {mode === 'edit' ? (
                    <Text size="sm" c="dimmed">{builtinKey}</Text>
                  ) : (
                    <Select data={[{ value: 'WEBSITE_URL', label: 'Website URL' }, { value: 'WEBSITE_NAME', label: 'Website Name' }]} value={builtinKey} onChange={(v: any) => setBuiltinKey(v)} />
                  )}
                  {/* Value */}
                  <Text fw={600} size="sm" mt={6}>Value</Text>
                  <TextInput placeholder={builtinKey === 'WEBSITE_URL' ? 'https://www.example.com' : 'Acme Inc.'} value={valueInput} onChange={(e) => setValueInput(e.currentTarget.value)} required />
                </>
              ) : (
                <>
                  {/* Key */}
                  <Text fw={600} size="sm">Key</Text>
                  {mode === 'edit' ? (
                    <Text size="sm" c="dimmed">{keyInput}</Text>
                  ) : (
                    <TextInput placeholder="MY_KEY" value={keyInput} onChange={(e) => setKeyInput(e.currentTarget.value)} required />
                  )}
                  {/* Value */}
                  <Text fw={600} size="sm" mt={6}>Value</Text>
                  <TextInput placeholder="value" value={valueInput} onChange={(e) => setValueInput(e.currentTarget.value)} />
                  <TextInput label="Hint (optional)" placeholder="Shown as helper text" value={hintInput} onChange={(e) => setHintInput(e.currentTarget.value)} />
                </>
              )}
              <Group justify="flex-end" mt="xs">
                <Button variant="default" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{mode === 'create' ? 'Add' : 'Save'}</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </EmployerAdminGate>
  );
}
