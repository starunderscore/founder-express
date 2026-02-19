"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Anchor, Button, Card, Group, Menu, Modal, NumberInput, Stack, Table, Tabs, Text, TextInput, Title } from '@mantine/core';
import { IconFileInvoice } from '@tabler/icons-react';
import { useFinanceStore } from '@/state/financeStore';
import LocalDataTable, { type Column } from '@/components/data-table/LocalDataTable';
import { useState } from 'react';

export default function InvoiceTemplatesRemovedPage() {
  const router = useRouter();
  const templates = useFinanceStore((s) => s.settings.templates);
  const updateTemplate = useFinanceStore((s) => s.updateTemplate);

  const removed = templates.filter((t) => !!t.deletedAt);
  const [tplOpen, setTplOpen] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplItemsCount, setTplItemsCount] = useState<number | string>('');

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconFileInvoice size={20} />
              <div>
                <Title order={2}>Invoice Templates</Title>
                <Text c="dimmed">Reusable invoice line items and taxes.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'removed'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/invoice-templates">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/invoice-templates/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/invoice-templates/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          {(() => {
            const columns: Column<any>[] = [
              { key: 'name', header: 'Name', render: (tpl: any) => (
                <Anchor onClick={() => { setTplName(tpl.name); setTplItemsCount(String(tpl.items.length)); setEditingTplId(tpl.id); setTplOpen(true); }}>
                  {tpl.name || '—'}
                </Anchor>
              ) },
              { key: 'items', header: 'Items', width: 120, render: (tpl: any) => <Text size="sm">{tpl.items.length}</Text> },
              { key: 'taxes', header: 'Taxes', width: 120, render: (tpl: any) => <Text size="sm">{tpl.taxIds.length}</Text> },
              { key: 'actions', header: '', width: 1, render: (tpl: any) => (
                <Menu withinPortal position="bottom-end" shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="Actions">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="19" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => updateTemplate(tpl.id, { deletedAt: undefined, isArchived: false })}>Restore</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            const rows = removed;
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>

        <Modal opened={tplOpen} onClose={() => { setTplOpen(false); setEditingTplId(null); }} title={'View template'} centered>
          <Stack>
            <TextInput label="Template name" value={tplName} onChange={(e) => setTplName(e.currentTarget.value)} readOnly />
            <NumberInput label="Items count" value={tplItemsCount as any} readOnly />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => { setTplOpen(false); setEditingTplId(null); }}>Close</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
