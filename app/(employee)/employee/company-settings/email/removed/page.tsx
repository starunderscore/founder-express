"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { Title, Text, Card, Stack, Group, Button, Tabs, Table, Menu, ActionIcon, Modal, TextInput, CopyButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { listenEmailVars, updateEmailVar, restoreEmailVar, removeEmailVar, type EmailVar } from '@/lib/firebase/emailSettings';

export default function EmailVarsRemovedPage() {
  const router = useRouter();
  const [emailVars, setEmailVars] = useState<EmailVar[]>([]);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EmailVar | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState('');

  useEffect(() => {
    const off = listenEmailVars(setEmailVars);
    return () => off();
  }, []);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Email management</Title>
            <Text c="dimmed">Manage email and configure the API adapter.</Text>
          </div>
        </Group>

        <Tabs value="variables">
          <Tabs.List>
            <Tabs.Tab value="variables"><Link href="/employee/company-settings/email">Email variables</Link></Tabs.Tab>
            <Tabs.Tab value="templates"><Link href="/employee/company-settings/email/templates">Email templates</Link></Tabs.Tab>
            <Tabs.Tab value="system-emails"><Link href="/employee/company-settings/email/system-emails">System emails</Link></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="variables" pt="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Email variables</Text>
            </Group>
            <Tabs value={'removed'}>
              <Tabs.List>
                <Tabs.Tab value="active"><Link href="/employee/company-settings/email">Active</Link></Tabs.Tab>
                <Tabs.Tab value="archive"><Link href="/employee/company-settings/email/archive">Archive</Link></Tabs.Tab>
                <Tabs.Tab value="removed"><Link href="/employee/company-settings/email/removed">Removed</Link></Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Card withBorder mt="sm">
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Key</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th style={{ width: 1 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {emailVars.filter((v)=>!!v.deletedAt).map((v) => (
                    <Table.Tr key={v.id}>
                      <Table.Td>{v.key}</Table.Td>
                      <Table.Td>{v.value}</Table.Td>
                      <Table.Td><Text c="dimmed" size="sm">{(v as any).description || '—'}</Text></Table.Td>
                      <Table.Td>
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
                            <Menu.Item onClick={async () => { const nv = prompt('Value', v.value) ?? v.value; await updateEmailVar(v.id, { value: nv }); }}>Edit</Menu.Item>
                            <Menu.Item onClick={async () => { await restoreEmailVar(v.id); }}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => { setRemoveTarget(v); setRemoveConfirm(''); setRemoveOpen(true); }}>Delete permanently</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {emailVars.filter((v)=>!!v.deletedAt).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}><Text c="dimmed">No variables</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>

            <Modal opened={removeOpen} onClose={() => setRemoveOpen(false)} title="Delete variable permanently" centered>
              <Stack>
                <Text>This will permanently delete the variable. To confirm, copy and paste the key exactly as shown below.</Text>
                <Group>
                  <Text fw={600}>{removeTarget?.key || ''}</Text>
                  <CopyButton value={removeTarget?.key || ''}>
                    {({ copied, copy }) => (
                      <Button size="xs" variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
                    )}
                  </CopyButton>
                </Group>
                <TextInput label="Paste key to confirm" placeholder="Paste here" value={removeConfirm} onChange={(e) => setRemoveConfirm(e.currentTarget.value)} autoFocus />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setRemoveOpen(false)}>Cancel</Button>
                  <Button color="red" disabled={!removeTarget || removeConfirm !== (removeTarget?.key || '')} onClick={async () => {
                    if (!removeTarget) return;
                    await removeEmailVar(removeTarget.id);
                    setRemoveOpen(false);
                    setRemoveTarget(null);
                    setRemoveConfirm('');
                  }}>Delete permanently</Button>
                </Group>
              </Stack>
            </Modal>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
