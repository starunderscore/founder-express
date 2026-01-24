"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Button, TextInput, Badge, ActionIcon, Modal } from '@mantine/core';
import { RichEmailEditor } from '@/components/RichEmailEditor';

export default function NewsletterComposePage() {
  const router = useRouter();
  const emailList = useSubscriptionsStore((s) => s.emailList);
  const addNewsletter = useSubscriptionsStore((s) => s.addNewsletterCampaign);

  const [subject, setSubject] = useState('');
  const [previewText] = useState('');
  const [contextId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [html, setHtml] = useState('');

  // HTML content is provided by RichEmailEditor via setHtml

  const onSave = () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    const html = (htmlStateRef || html) as string;
    addNewsletter({
      subject: subject.trim(),
      // preview text removed from minimal compose
      status: 'Draft',
      recipients: recipientCount,
      body: html,
      // context waitlist removed from minimal compose
    });
    router.push('/employee/email-subscriptions/newsletters');
  };

  const onPreview = () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    setPreviewOpen(true);
  };

  const onSend = () => {
    if (!subject.trim()) { setError('Subject required'); return; }
    const ok = window.confirm(`Send this newsletter to ${recipientCount} recipients?`);
    if (!ok) return;
    const html = (htmlStateRef || html) as string;
    addNewsletter({
      subject: subject.trim(),
      status: 'Sent',
      recipients: recipientCount,
      sentAt: Date.now(),
      body: html,
    } as any);
    router.push('/employee/email-subscriptions/newsletters');
  };

  const recipientCount = emailList.length;
  const htmlStateRef = html;

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/newsletters')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Compose newsletter</Title>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={onPreview}>Preview</Button>
            <Button onClick={onSend}>Send</Button>
            <Button variant="light" onClick={onSave}>Save draft</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <Group>
              <Badge size="lg" variant="light" color="indigo">Recipients: {recipientCount}</Badge>
            </Group>
            <TextInput label="Subject" placeholder="Product update and improvements" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required autoFocus />
            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" size="lg" centered>
          <Stack>
            <Group justify="space-between">
              <Title order={4} style={{ margin: 0 }}>{subject || '(No subject)'}</Title>
              <Badge variant="light">Recipients: {recipientCount}</Badge>
            </Group>
            <Card withBorder>
              <div dangerouslySetInnerHTML={{ __html: html || '<em>No content</em>' }} />
            </Card>
          </Stack>
        </Modal>

        <Card withBorder>
          <Stack gap={8}>
            <RichEmailEditor placeholder="Write your message…" onChangeHTML={setHtml} />
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
