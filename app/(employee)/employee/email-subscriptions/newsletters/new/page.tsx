"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, TextInput, Badge, ActionIcon, Select } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import { IconMail } from '@tabler/icons-react';
import { RichEmailEditor } from '@/components/RichEmailEditor';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { listenEmailVars, type EmailVar } from '@/services/company-settings/email-variables';
import { getNewsletterDoc, updateNewsletterDoc, createNewsletter, markNewsletterSent } from '@/services/email-subscriptions/newsletters';
import EmailPreviewModal from '@/components/email/EmailPreviewModal';

export default function NewsletterComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const toast = useToast();
  const [recipientCount, setRecipientCount] = useState(0);
  useEffect(() => {
    const qList = query(collection(db(), 'email_list'));
    const unsub = onSnapshot(qList, (snap) => setRecipientCount(snap.size));
    return () => unsub();
  }, []);

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

  const [subject, setSubject] = useState('');
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const [previewText] = useState('');
  const [contextId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [vars, setVars] = useState<EmailVar[]>([]);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);

  // HTML content is provided by RichEmailEditor via setHtml

  // Load existing draft when editing
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!editId) return;
      const row = await getNewsletterDoc(editId);
      if (!mounted || !row) return;
      setSubject(row.subject || '');
      setHtml(row.body || '');
    })();
    return () => { mounted = false; };
  }, [editId]);

  const onSave = async () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    const bodyHtml = html;
    if (editId) {
      await updateNewsletterDoc(editId, { subject: subject.trim(), body: bodyHtml, recipients: recipientCount, draftedAt: Date.now(), status: 'Draft' as any });
    } else {
      await createNewsletter({ subject: subject.trim(), body: bodyHtml, status: 'Draft' as any });
    }
    toast.show({ title: 'Draft saved', message: subject.trim(), color: 'green' });
    router.push('/employee/email-subscriptions/newsletters/drafts');
  };

  const onPreview = () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    setPreviewOpen(true);
  };

  const onSend = async () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    const ok = window.confirm(`Send this newsletter to ${recipientCount} recipients?`);
    if (!ok) return;
    const bodyHtml = html;
    if (editId) {
      await updateNewsletterDoc(editId, { subject: subject.trim(), body: bodyHtml, recipients: recipientCount });
      await markNewsletterSent(editId, recipientCount);
    } else {
      const id = await createNewsletter({ subject: subject.trim(), body: bodyHtml });
      await markNewsletterSent(id, recipientCount);
    }
    toast.show({ title: 'Newsletter sent', message: subject.trim(), color: 'green' });
    router.push('/employee/email-subscriptions/newsletters');
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon
              variant="subtle"
              size="lg"
              aria-label="Back"
              onClick={() => router.push(editId ? '/employee/email-subscriptions/newsletters/drafts' : '/employee/email-subscriptions/newsletters')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconMail size={20} />
              <div>
                <Title order={2}>Compose newsletter</Title>
                <Text c="dimmed">Draft, preview, and send a newsletter email.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={onSave}>Save draft</Button>
            <Button variant="light" onClick={onPreview}>Preview</Button>
            <Button onClick={onSend}>Send</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <Group>
              <Badge size="lg" variant="light" color="indigo">Recipients: {recipientCount}</Badge>
            </Group>
            <Stack gap={4}>
              <Text fw={500}>Subject <span style={{ color: 'var(--mantine-color-red-filled)' }}>*</span></Text>
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
              <TextInput ref={subjectRef as any} placeholder="Product update and improvements" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required autoFocus />
            </Stack>
            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>

        <EmailPreviewModal opened={previewOpen} onClose={() => setPreviewOpen(false)} subject={subject || ''} html={html || ''} />

        <Card withBorder>
          <Stack gap={8}>
            <Text fw={500}>Body <span style={{ color: 'var(--mantine-color-red-filled)' }}>*</span></Text>
            <RichEmailEditor placeholder="Write your message…" initialHTML={html} onChangeHTML={setHtml} />
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
