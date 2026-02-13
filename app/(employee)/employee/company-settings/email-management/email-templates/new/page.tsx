"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, TextInput, Modal, ActionIcon, Select } from '@mantine/core';
import { useMemo, useRef, useState, useEffect } from 'react';
import { RichEmailEditor } from '@/components/RichEmailEditor';
import { EmailPreviewWindow } from '@/components/EmailPreviewWindow';
import { listenEmailVars, type EmailVar } from '@/lib/firebase/emailSettings';
import { createEmailTemplate, updateEmailTemplateDoc, getEmailTemplateDoc } from '@/services/company-settings/email-templates';

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const search = useSearchParams();
  const editId = search.get('edit') || '';
  const isEditing = !!editId;
  const isAuthSpecial = editId === 'auth-password-reset' || editId === 'auth-email-verification';

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [vars, setVars] = useState<EmailVar[]>([]);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const off = listenEmailVars(setVars);
    return () => off();
  }, []);

  const insertVarIntoSubject = (key: string) => {
    const token = `{{${key}}}`;
    const el = subjectRef.current;
    if (!el) { setSubject((s) => s + token); return; }
    const start = el.selectionStart ?? subject.length;
    const end = el.selectionEnd ?? start;
    const next = subject.slice(0, start) + token + subject.slice(end);
    setSubject(next);
    requestAnimationFrame(() => {
      try { el.focus(); const pos = start + token.length; el.setSelectionRange(pos, pos); } catch {}
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editId) { setLoaded(true); return; }
      const tpl = await getEmailTemplateDoc(editId);
      if (!cancelled) {
        if (tpl) { setName(tpl.name || ''); setSubject(tpl.subject || ''); setHtml(tpl.body || ''); }
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [editId]);

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name required'); return; }
    if (!subject.trim()) { setError('Subject required'); return; }
    // Disallow reserved system template names
    const reserved = ['password reset', 'verify email'];
    if (reserved.includes(trimmed.toLowerCase())) {
      setError('This name is reserved. Please choose another.');
      return;
    }
    const body = html || '';
    if (editId) await updateEmailTemplateDoc(editId, { name: trimmed, subject: subject.trim(), body });
    else await createEmailTemplate({ name: trimmed, subject: subject.trim(), body });
    router.push('/employee/company-settings/email-management/email-templates');
  };

  const varMap = useMemo(() => {
    const map: Record<string, string> = Object.fromEntries(vars.map((v) => [v.key, v.value]));
    // Built-in
    map.USERNAME = 'there';
    if (isAuthSpecial) {
      map.ACTION_URL = 'https://example.com/action';
    }
    return map;
  }, [vars, isAuthSpecial]);

  const renderTokens = (s: string) =>
    (s || '').replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key: string) => (varMap[key] ?? `{{${key}}}`));

  const renderedSubject = useMemo(() => renderTokens(subject), [subject, varMap]);
  const renderedHtml = useMemo(() => renderTokens(html), [html, varMap]);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings/email-management/email-templates')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>{isEditing ? 'Edit template' : 'New template'}</Title>
              <Text c="dimmed">Create a starting point for your next email.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button onClick={onSave}>{isEditing ? 'Save changes' : 'Create template'}</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Welcome Email"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
              readOnly={isAuthSpecial}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Group>
              <Text size="sm" fw={500}>Subject <span style={{ color: 'var(--mantine-color-red-filled)' }}>*</span></Text>
            </Group>
            <Select
              style={{ width: 260, alignSelf: 'flex-start' }}
              size="xs"
              placeholder="Insert variable"
              value={selectedVar}
              onChange={(val) => { if (!val) return; setSelectedVar(null); insertVarIntoSubject(val); }}
              data={[
                {
                  group: 'Built-in',
                  items: [
                    { value: 'USERNAME', label: 'USERNAME' },
                    ...(isAuthSpecial ? [{ value: 'ACTION_URL', label: 'ACTION_URL' }] : []),
                  ],
                },
                { group: 'Email variables', items: vars.map((v) => ({ value: v.key, label: v.key })) },
              ] as any}
              aria-label="Insert variable"
              comboboxProps={{ withinPortal: true }}
            />
            <TextInput ref={subjectRef as any} placeholder="Welcome to our product" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required />
            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap={8}>
            <Group>
              <Text size="sm" fw={500}>Body <span style={{ color: 'var(--mantine-color-red-filled)' }}>*</span></Text>
            </Group>
            <RichEmailEditor placeholder="Write your message…" initialHTML={html} onChangeHTML={setHtml} />
          </Stack>
        </Card>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" size="xl" centered>
          <EmailPreviewWindow subject={renderedSubject} html={renderedHtml} />
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
