"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, ActionIcon, PasswordInput, Tabs, Badge, Select, Modal, Menu, CopyButton } from '@mantine/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import LinkExt from '@tiptap/extension-link';
import { IconBold, IconItalic, IconUnderline, IconList, IconListNumbers, IconAlignLeft, IconAlignCenter, IconAlignRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { useEffect, useState } from 'react';
import { Table } from '@mantine/core';
import { listenEmailVars, addEmailVar, updateEmailVar, removeEmailVar, archiveEmailVar, type EmailVar } from '@/lib/firebase/emailSettings';

export default function EmailSettingsPage() {
  const router = useRouter();
  const settings = useAppSettingsStore((s) => s.settings.email);
  const addIntegration = useAppSettingsStore((s) => s.addEmailIntegration);
  const updateIntegration = useAppSettingsStore((s) => s.updateEmailIntegration);
  const removeIntegration = useAppSettingsStore((s) => s.removeEmailIntegration);
  const templates = useAppSettingsStore((s) => s.settings.email.templates || []);
  const addTemplate = useAppSettingsStore((s) => s.addEmailTemplate);
  const updateTemplate = useAppSettingsStore((s) => s.updateEmailTemplate);
  const removeTemplate = useAppSettingsStore((s) => s.removeEmailTemplate);
  const [iOpen, setIOpen] = useState(false);
  const [provider, setProvider] = useState<'sendgrid' | 'mailgun' | 'postmark' | 'resend' | ''>('');
  const [ilabel, setILabel] = useState('');
  const [iapikey, setIApiKey] = useState('');
  const [tVOpen, setTVOpen] = useState(false);
  const [tvKey, setTvKey] = useState('');
  const [tvValue, setTvValue] = useState('');
  const [tvDescription, setTvDescription] = useState('');
  const [emailVars, setEmailVars] = useState<EmailVar[]>([]);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EmailVar | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState('');
  const [tOpen, setTOpen] = useState(false);
  const [tMode, setTMode] = useState<'create' | 'edit'>('create');
  const [tId, setTId] = useState('');
  const [tName, setTName] = useState('');
  const [tSubject, setTSubject] = useState('');
  const editor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: 'Template content (supports variables like {{COMPANY_NAME}})' }), LinkExt.configure({ openOnClick: false }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
    content: '',
    immediatelyRender: false,
  });

  const onAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !iapikey.trim()) return;
    addIntegration({ provider, apiKey: iapikey.trim(), label: ilabel.trim() || undefined });
    setProvider(''); setILabel(''); setIApiKey(''); setIOpen(false);
  };

  useEffect(() => {
    const off = listenEmailVars(setEmailVars);
    return () => off();
  }, []);

  const onAddTV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvKey.trim()) return;
    await addEmailVar({ key: tvKey.trim(), value: tvValue, description: tvDescription || undefined });
    setTvKey(''); setTvValue(''); setTvDescription(''); setTVOpen(false);
  };

  const openCreateTemplate = () => {
    setTMode('create'); setTId(''); setTName(''); setTSubject(''); editor?.commands.setContent(''); setTOpen(true);
  };
  const openEditTemplate = (tpl: any) => {
    setTMode('edit'); setTId(tpl.id); setTName(tpl.name); setTSubject(tpl.subject); editor?.commands.setContent(tpl.body || ''); setTOpen(true);
  };
  const onSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const body = editor?.getHTML() || '';
    if (!tName.trim()) return;
    if (tMode === 'create') {
      addTemplate({ name: tName.trim(), subject: tSubject.trim(), body });
    } else {
      updateTemplate(tId, { name: tName.trim(), subject: tSubject.trim(), body });
    }
    setTOpen(false);
  };

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
              <Button onClick={() => setTVOpen(true)}>Add variable</Button>
            </Group>
            <Tabs value={'active'}>
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
                  {emailVars.filter((v)=>!v.archivedAt && !v.deletedAt).map((v) => (
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
                            <Menu.Item onClick={async () => { await archiveEmailVar(v.id, true); }}>Archive</Menu.Item>
                            <Menu.Item color="red" onClick={() => { setRemoveTarget(v); setRemoveConfirm(''); setRemoveOpen(true); }}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {emailVars.filter((v)=>!v.archivedAt && !v.deletedAt).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}><Text c="dimmed">No variables</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>

            <Modal opened={tVOpen} onClose={() => setTVOpen(false)} title="Add email variable" centered>
              <form onSubmit={onAddTV}>
                <Stack>
                  <TextInput label="Key" placeholder="COMPANY_NAME" value={tvKey} onChange={(e) => setTvKey(e.currentTarget.value)} required />
                  <TextInput label="Value" placeholder="Acme Inc." value={tvValue} onChange={(e) => setTvValue(e.currentTarget.value)} required />
                  <TextInput label="Description (optional)" placeholder="Shown here to explain this variable" value={tvDescription} onChange={(e) => setTvDescription(e.currentTarget.value)} />
                  <Group justify="flex-end">
                    <Button variant="default" onClick={() => setTVOpen(false)} type="button">Cancel</Button>
                    <Button type="submit">Add</Button>
                  </Group>
                </Stack>
              </form>
            </Modal>

            <Modal opened={removeOpen} onClose={() => setRemoveOpen(false)} title="Remove variable" centered>
              <Stack>
                <Text>This action cannot be undone. To confirm, copy and paste the key exactly as shown below.</Text>
                <Group>
                  <Text fw={600}>{removeTarget?.key || ''}</Text>
                  <CopyButton value={removeTarget?.key || ''}>
                    {({ copied, copy }) => (
                      <Button size="xs" variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
                    )}
                  </CopyButton>
                </Group>
                <TextInput
                  label="Paste key to confirm"
                  placeholder="Paste here"
                  value={removeConfirm}
                  onChange={(e) => setRemoveConfirm(e.currentTarget.value)}
                  autoFocus
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setRemoveOpen(false)}>Cancel</Button>
                  <Button color="red" disabled={!removeTarget || removeConfirm !== (removeTarget?.key || '')} onClick={async () => {
                    if (!removeTarget) return;
                    await removeEmailVar(removeTarget.id);
                    setRemoveOpen(false);
                    setRemoveTarget(null);
                    setRemoveConfirm('');
                  }}>Remove</Button>
                </Group>
              </Stack>
            </Modal>
          </Tabs.Panel>

          <Tabs.Panel value="templates" pt="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Email templates</Text>
              <Button onClick={openCreateTemplate}>New template</Button>
            </Group>
            <Stack>
              {templates.map((t) => (
                <Card withBorder key={t.id}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>{t.name}</Text>
                      <Text size="sm" c="dimmed">Subject: {t.subject || '—'}</Text>
                      <Text size="sm" c="dimmed">Updated: {new Date(t.updatedAt).toLocaleString()}</Text>
                    </div>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openEditTemplate(t)}>Edit</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeTemplate(t.id)}>Delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card>
              ))}
              {templates.length === 0 && (
                <Card withBorder><Text c="dimmed">No templates yet</Text></Card>
              )}
            </Stack>

            <Modal opened={tOpen} onClose={() => setTOpen(false)} title={tMode === 'create' ? 'New template' : 'Edit template'} size="lg" centered>
              <form onSubmit={onSaveTemplate}>
                <Stack>
                  <Group grow>
                    <TextInput label="Name" placeholder="Welcome email" value={tName} onChange={(e) => setTName(e.currentTarget.value)} required />
                    <TextInput label="Subject" placeholder="Welcome to {{COMPANY_NAME}}" value={tSubject} onChange={(e) => setTSubject(e.currentTarget.value)} />
                  </Group>
                  <Card withBorder>
                    <Group gap={6} wrap="wrap" mb={6}>
                      <Button size="xs" variant={editor?.isActive('bold') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }} leftSection={<IconBold size={14} />}>Bold</Button>
                      <Button size="xs" variant={editor?.isActive('italic') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }} leftSection={<IconItalic size={14} />}>Italic</Button>
                      <Button size="xs" variant={editor?.isActive('underline') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }} leftSection={<IconUnderline size={14} />}>Underline</Button>
                      <Button size="xs" variant={editor?.isActive('bulletList') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }} leftSection={<IconList size={14} />}>Bulleted</Button>
                      <Button size="xs" variant={editor?.isActive('orderedList') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }} leftSection={<IconListNumbers size={14} />}>Numbered</Button>
                      <Button size="xs" variant={editor?.isActive({ textAlign: 'left' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('left').run(); }} leftSection={<IconAlignLeft size={14} />}>Left</Button>
                      <Button size="xs" variant={editor?.isActive({ textAlign: 'center' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('center').run(); }} leftSection={<IconAlignCenter size={14} />}>Center</Button>
                      <Button size="xs" variant={editor?.isActive({ textAlign: 'right' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('right').run(); }} leftSection={<IconAlignRight size={14} />}>Right</Button>
                    </Group>
                    <div style={{ minHeight: 220 }}>
                      <EditorContent editor={editor} />
                    </div>
                  </Card>
                  <Text size="sm" c="dimmed">Tip: Use variables like {'{{COMPANY_NAME}}'} in your subject or body. Variables are defined in Email variables.</Text>
                  <Group justify="flex-end">
                    <Button variant="default" type="button" onClick={() => setTOpen(false)}>Cancel</Button>
                    <Button type="submit">Save</Button>
                  </Group>
                </Stack>
              </form>
            </Modal>
          </Tabs.Panel>

          <Tabs.Panel value="configure" pt="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Third‑party email providers</Text>
              <Button onClick={() => setIOpen(true)}>Add integration</Button>
            </Group>
            <Stack>
              {(settings.integrations || []).map((i) => (
                <Card withBorder key={i.id}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8}>
                        <Text fw={600} tt="capitalize">{i.provider}</Text>
                        {i.enabled ? <Badge variant="light" color="green">Enabled</Badge> : <Badge variant="light" color="gray">Disabled</Badge>}
                      </Group>
                      {i.label && <Text size="sm" c="dimmed">{i.label}</Text>}
                      <Text size="sm" c="dimmed">Key: {i.apiKey ? '••••' + i.apiKey.slice(-4) : '—'}</Text>
                    </div>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => updateIntegration(i.id, { enabled: !i.enabled })}>{i.enabled ? 'Disable' : 'Enable'}</Menu.Item>
                        <Menu.Item onClick={() => updateIntegration(i.id, { label: prompt('Label', i.label || '') || i.label })}>Rename</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeIntegration(i.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card>
              ))}
              {(settings.integrations || []).length === 0 && (
                <Card withBorder><Text c="dimmed">No integrations yet</Text></Card>
              )}
            </Stack>

            <Modal opened={iOpen} onClose={() => setIOpen(false)} title="Add email integration" centered>
              <form onSubmit={onAddIntegration}>
                <Stack>
                  <Select
                    label="Provider"
                    placeholder="Pick one"
                    data={[
                      { value: 'sendgrid', label: 'SendGrid (popular, free tier)' },
                      { value: 'mailgun', label: 'Mailgun' },
                      { value: 'postmark', label: 'Postmark' },
                      { value: 'resend', label: 'Resend (developer-friendly)' },
                    ]}
                    value={provider}
                    onChange={(v: any) => setProvider(v)}
                    required
                  />
                  <TextInput label="Label (optional)" placeholder="e.g. Marketing" value={ilabel} onChange={(e) => setILabel(e.currentTarget.value)} />
                  <PasswordInput label="API key" placeholder="Paste provider API key" value={iapikey} onChange={(e) => setIApiKey(e.currentTarget.value)} required />
                  <Group justify="flex-end">
                    <Button variant="default" onClick={() => setIOpen(false)} type="button">Cancel</Button>
                    <Button type="submit">Add</Button>
                  </Group>
                </Stack>
              </form>
            </Modal>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
