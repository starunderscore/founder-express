"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Button, Card, Group, Stack, Text, TextInput, Title, Select, Modal } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getSystemEmail, saveSystemEmail, listenEmailVars, type EmailVar } from '@/lib/firebase/emailSettings';
import { EmailPreviewWindow } from '@/components/EmailPreviewWindow';
import { RichEmailEditor } from '@/components/RichEmailEditor';

export default function PasswordResetSystemEmailPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
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
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  useEffect(() => {
    getSystemEmail('password_reset').then((e) => {
      setSubject(e?.subject || 'Reset your password for {{COMPANY_NAME}}');
      setHtml(e?.body || '<p>Hi {{USERNAME}},</p><p>Click the link below to reset your password:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Reset password</a></p><p>If you did not request this, you can ignore this email.</p><p>— {{COMPANY_NAME}}</p>');
    });
  }, []);

  const onSave = async () => {
    setStatus('saving');
    try {
      if (!html.trim()) { setStatus('error'); setTimeout(() => setStatus('idle'), 1500); return; }
      await saveSystemEmail('password_reset', { subject: subject.trim(), body: html });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1200);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings/email-management/system-emails')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Password reset email</Title>
            <Text c="dimmed">Customize the subject and HTML content.</Text>
          </div>
          <Group gap="xs" ml="auto">
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button onClick={onSave} loading={status === 'saving'}>Save</Button>
          </Group>
        </Group>

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
                { group: 'Built-in', items: [{ value: 'USERNAME', label: 'USERNAME' }, { value: 'ACTION_URL', label: 'ACTION_URL' }] },
                { group: 'Email variables', items: vars.map((v) => ({ value: v.key, label: v.key })) },
              ] as any}
              aria-label="Insert variable"
              comboboxProps={{ withinPortal: true }}
            />
            <TextInput
              ref={subjectRef as any}
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.currentTarget.value)}
              required
              aria-label="Subject"
            />
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

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} size="xl" centered>
          <Stack>
            <EmailPreviewWindow subject={subject.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key) => (key === 'USERNAME' ? 'there' : key === 'ACTION_URL' ? 'https://example.com/action' : (vars.find(v => v.key === key)?.value || `{{${key}}}`)))} html={html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key) => (key === 'USERNAME' ? 'there' : key === 'ACTION_URL' ? 'https://example.com/action' : (vars.find(v => v.key === key)?.value || `{{${key}}}`)))} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
