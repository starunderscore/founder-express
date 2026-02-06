"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSystemEmail, saveSystemEmail } from '@/lib/firebase/emailSettings';
import { WebContentEditor } from '@/components/WebContentEditor';

export default function VerifyEmailSystemEmailPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  useEffect(() => {
    getSystemEmail('verify_email').then((e) => {
      setSubject(e?.subject || 'Verify your email for {{COMPANY_NAME}}');
      setBody(e?.body || '<p>Hi {{USERNAME}},</p><p>Please confirm your email address by clicking the link below:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Verify email</a></p><p>Thanks!<br/>— {{COMPANY_NAME}}</p>');
    });
  }, []);

  const onSave = async () => {
    setStatus('saving');
    try {
      await saveSystemEmail('verify_email', { subject: subject.trim(), body });
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
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings/email/system-emails')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Verify email</Title>
            <Text c="dimmed">Customize the subject and HTML content.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Stack>
            <TextInput label="Subject" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required />
            <div>
              <Text fw={600} mb={6}>Body (HTML)</Text>
              <WebContentEditor initialHTML={body} onChangeHTML={setBody} defaultShowLabels={false} minRows={12} />
            </div>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => router.push('/employee/company-settings/email/system-emails')}>Cancel</Button>
              <Button onClick={onSave} loading={status === 'saving'}>Save</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

