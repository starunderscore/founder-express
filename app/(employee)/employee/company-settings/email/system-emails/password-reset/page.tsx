"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSystemEmail, saveSystemEmail } from '@/lib/firebase/emailSettings';
import { WebContentEditor } from '@/components/WebContentEditor';

export default function PasswordResetSystemEmailPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  useEffect(() => {
    getSystemEmail('password_reset').then((e) => {
      setSubject(e?.subject || 'Reset your password for {{COMPANY_NAME}}');
      setBody(e?.body || '<p>Hi {{USERNAME}},</p><p>Click the link below to reset your password:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Reset password</a></p><p>If you did not request this, you can ignore this email.</p><p>— {{COMPANY_NAME}}</p>');
    });
  }, []);

  const onSave = async () => {
    setStatus('saving');
    try {
      await saveSystemEmail('password_reset', { subject: subject.trim(), body });
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
            <Title order={2} mb={4}>Password reset email</Title>
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

