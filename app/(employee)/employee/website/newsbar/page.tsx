"use client";
import { useState, useEffect } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useWebsiteStore } from '@/state/websiteStore';
import { Title, Text, Card, Stack, Group, TextInput, Button, Alert, Switch, Badge } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function NewsbarSettingsPage() {
  const router = useRouter();
  const newsbar = useWebsiteStore((s) => s.newsbar);
  const updateNewsbar = useWebsiteStore((s) => s.updateNewsbar);

  const [enabled, setEnabled] = useState(!!newsbar.enabled);
  const [headline, setHeadline] = useState(newsbar.headline);
  const [link, setLink] = useState(newsbar.link);
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(!!newsbar.enabled);
    setHeadline(newsbar.headline);
    setLink(newsbar.link);
  }, [newsbar.enabled, newsbar.headline, newsbar.link]);

  const onSave = () => {
    setError(null);
    setStatus('saving');
    try {
      updateNewsbar({ enabled, headline: headline.trim(), link: link.trim() });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1200);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
      setStatus('error');
    }
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>News Bar</Title>
            <Group gap={8}>
              <Text c="dimmed">Set a short message and link shown at the top of your site.</Text>
              <Badge variant="light" color={enabled ? 'green' : 'gray'}>{enabled ? 'On' : 'Off'}</Badge>
            </Group>
          </div>
          <Button variant="light" onClick={() => router.push('/employee/website')}>Back</Button>
        </Group>

        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <Text fw={600}>Show News Bar</Text>
              <Switch checked={enabled} onChange={(e) => setEnabled(e.currentTarget.checked)} aria-label="Toggle news bar visibility" />
            </Group>
            <TextInput
              label="Headline"
              placeholder="e.g., We just launched our new feature!"
              value={headline}
              onChange={(e) => setHeadline(e.currentTarget.value)}
            />
            <TextInput
              label="Link"
              placeholder="https://example.com/announcement"
              value={link}
              onChange={(e) => setLink(e.currentTarget.value)}
            />
            {error && <Alert color="red">{error}</Alert>}
            {status === 'saved' && <Alert color="green">Saved</Alert>}
            <Group justify="flex-end">
              <Button onClick={onSave} loading={status === 'saving'}>Save</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
