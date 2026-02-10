"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button, Menu, ActionIcon, Tabs, Modal, TextInput, Textarea } from '@mantine/core';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveEmailVarDoc, softRemoveEmailVarDoc, createEmailVar, updateEmailVarDoc, type EmailVar } from '@/services/company-settings/email-variables';
import { IconForms } from '@tabler/icons-react';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import EmailVarRemoveModal from '@/components/admin-settings/email-variables/EmailVarRemoveModal';

export default function EmailVariablesArchivePage() {
  const router = useRouter();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [varKey, setVarKey] = useState('');
  const [varValue, setVarValue] = useState('');
  const [varDesc, setVarDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [target, setTarget] = useState<(EmailVar & { id: string }) | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const columns: Column<EmailVar & { id: string }>[] = [
    { key: 'key', header: 'Key', render: (r) => (
      <Text
        style={{ color: 'var(--mantine-color-blue-6)', cursor: 'pointer' }}
        onClick={() => { setEditId(r.id); setEditKey(r.key); setEditValue(r.value); setEditDesc(r.description || ''); setEditOpen(true); }}
        aria-label={`Edit ${r.key}`}
      >
        {r.key || '—'}
      </Text>
    ) },
    { key: 'value', header: 'Value', render: (r) => (<Text c="dimmed" size="sm">{r.value || '—'}</Text>) },
    { key: 'description', header: 'Description', render: (r) => (
      <Text c={r.description ? undefined : 'dimmed'} size="sm" lineClamp={2}>{r.description || '—'}</Text>
    ) },
    {
      key: 'actions', header: '', width: 1,
      render: (r) => (
        <Group justify="flex-end">
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
              <Menu.Item onClick={() => { setEditId(r.id); setEditKey(r.key); setEditValue(r.value); setEditDesc(r.description || ''); setEditOpen(true); }}>Edit</Menu.Item>
              <Menu.Item onClick={() => { setTarget(r); setConfirmRestore(true); }}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmRemove(true); }}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    }
  ];

  return (
    <EmployerAdminGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings/email-management')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconForms size={20} />
            <div>
              <Title order={2} mb={4}>Email variables</Title>
              <Text c="dimmed">Define variables used in templates and system emails.</Text>
            </div>
          </Group>
          <Group gap="xs" ml="auto">
            <Button variant="light" onClick={() => setAddOpen(true)}>Add variable</Button>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/company-settings/email-management/email-variables">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/company-settings/email-management/email-variables/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/company-settings/email-management/email-variables/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <FirestoreDataTable
            collectionPath="ep_company_settings/global/email_vars"
            columns={columns}
            initialSort={{ field: 'key', direction: 'asc' }}
            clientFilter={(r: any) => !!r.archivedAt && !r.deletedAt}
            defaultPageSize={25}
            enableSelection={false}
            refreshKey={refreshKey}
          />
        </Card>

        <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add email variable" centered>
          <Stack>
            <TextInput label="Key" placeholder="COMPANY_NAME" value={varKey} onChange={(e) => setVarKey(e.currentTarget.value)} required />
            <TextInput label="Value" placeholder="Acme Inc." value={varValue} onChange={(e) => setVarValue(e.currentTarget.value)} required />
            <Textarea label="Description" placeholder="Shown in email headers/footers" value={varDesc} onChange={(e) => setVarDesc(e.currentTarget.value)} minRows={2} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button loading={saving} onClick={async () => {
                const k = varKey.trim(); const v = varValue.trim();
                if (!k || !v) return;
                setSaving(true);
                try {
                  await createEmailVar({ key: k, value: v, description: varDesc.trim() || undefined });
                  toast.show({ title: 'Variable added', message: k, color: 'green' });
                  setAddOpen(false); setVarKey(''); setVarValue(''); setVarDesc('');
                  router.push('/employee/company-settings/email-management/email-variables');
                } finally { setSaving(false); }
              }}>Add</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Edit email variable" centered>
          <Stack>
            <TextInput label="Key" value={editKey} onChange={(e) => setEditKey(e.currentTarget.value)} required />
            <TextInput label="Value" value={editValue} onChange={(e) => setEditValue(e.currentTarget.value)} required />
            <Textarea label="Description" value={editDesc} onChange={(e) => setEditDesc(e.currentTarget.value)} minRows={2} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button loading={saving} onClick={async () => {
                if (!editId) return;
                const k = editKey.trim(); const v = editValue.trim();
                if (!k || !v) return;
                setSaving(true);
                try {
                  await updateEmailVarDoc(editId, { key: k, value: v, description: editDesc.trim() || undefined });
                  toast.show({ title: 'Variable updated', message: k, color: 'green' });
                  setEditOpen(false);
                  router.push('/employee/company-settings/email-management/email-variables');
                } finally { setSaving(false); }
              }}>Save</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restore variable" centered>
          <Stack>
            <Text>Restore this variable back to Active?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await archiveEmailVarDoc(target.id, false);
                setConfirmRestore(false); setTarget(null);
                setRefreshKey((rk) => rk + 1);
                toast.show({ title: 'Variable restored', message: target.key, color: 'green' });
              }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <EmailVarRemoveModal
          opened={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          varKey={target?.key || ''}
          onConfirm={async () => {
            if (!target) return;
            await softRemoveEmailVarDoc(target.id);
            setConfirmRemove(false); setTarget(null);
            setRefreshKey((rk) => rk + 1);
            toast.show({ title: 'Variable moved to removed', message: target.key, color: 'orange' });
          }}
        />
      </Stack>
    </EmployerAdminGate>
  );
}
