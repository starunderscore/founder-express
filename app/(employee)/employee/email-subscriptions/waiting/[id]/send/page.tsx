"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Button, TextInput, Badge, Modal, ActionIcon, Anchor } from '@mantine/core';
import { RichEmailEditor } from '@/components/RichEmailEditor';

export default function SendEmailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const waitlists = useSubscriptionsStore((s) => s.waitlists);
  const sendEmail = useSubscriptionsStore((s) => s.sendEmailToWaitlist);
  const saveDraft = useSubscriptionsStore((s) => s.saveDraftToWaitlist);

  const [selectedId, setSelectedId] = useState(params.id);
  const list = useMemo(() => waitlists.find((b) => b.id === selectedId) || null, [waitlists, selectedId]);

  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chooseOpen, setChooseOpen] = useState(false);

  if (!list) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Waiting list not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/email-subscriptions/waiting')}>Back to list</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  const sample = list.entries[0] || null;
  const personalize = (text: string) => {
    const name = sample?.name || 'there';
    return text.replaceAll('{{name}}', name);
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const res = sendEmail(list.id, subject, html);
    if (!res.ok) { setError(res.reason || 'Failed to send'); return; }
    router.push(`/employee/email-subscriptions/waiting/${list.id}`);
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/email-subscriptions/waiting/${list.id}`)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Send email</Title>
              <Group gap={8} mt={4}>
                <Text c="dimmed">
                  To: <Anchor component="button" underline="always" onClick={() => setChooseOpen(true)}>{list.name}</Anchor>
                </Text>
                <Badge variant="light">{list.entries.length} recipients</Badge>
              </Group>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => { const res = saveDraft(list.id, subject, html); if (!res.ok) return; }}>Save draft</Button>
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button onClick={onSend}>Send</Button>
          </Group>
        </Group>

        <Card withBorder>
          <form onSubmit={onSend}>
            <Stack>
              <TextInput label="Subject" placeholder="e.g. Welcome to the beta" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required autoFocus />
              <Card withBorder>
                <Stack gap={8}>
                  <RichEmailEditor placeholder="Write your message. Use {{name}} to personalize." onChangeHTML={setHtml} />
                </Stack>
              </Card>
              <Text size="sm" c="dimmed">Tip: Use {'{{name}}'} to personalize with each recipient's name.</Text>
              {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
          </form>
        </Card>

        <Modal opened={chooseOpen} onClose={() => setChooseOpen(false)} title="Select waiting list" centered>
          <Stack>
            {waitlists.length === 0 && <Text c="dimmed">No waiting lists available.</Text>}
            {waitlists.map((wl) => (
              <Card withBorder key={wl.id}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={600}>{wl.name}</Text>
                    <Text size="sm" c="dimmed">{wl.entries.length} recipients</Text>
                  </div>
                  <Button onClick={() => { setSelectedId(wl.id); setChooseOpen(false); router.replace(`/employee/email-subscriptions/waiting/${wl.id}/send`); }}>Select</Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Modal>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" size="lg" centered>
          <Stack>
            {sample ? (
              <>
                <Text size="sm" c="dimmed">Example recipient: {sample.name || sample.email}</Text>
                <Text><Text span fw={600}>Subject:</Text> {personalize(subject || '(no subject)')}</Text>
                <Card withBorder>
                  <div dangerouslySetInnerHTML={{ __html: personalize(html || '') }} />
                </Card>
              </>
            ) : (
              <Text c="dimmed">No recipients yet. Add entries to this waiting list to preview.</Text>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button onClick={onSend}>Send</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}

