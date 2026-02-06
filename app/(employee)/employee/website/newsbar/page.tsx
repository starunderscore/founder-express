"use client";
import { useState, useEffect } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useWebsiteStore } from '@/state/websiteStore';
import { Title, Text, Card, Stack, Group, Button, Alert, Switch, ActionIcon, Divider, Modal } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { WebContentEditor } from '@/components/WebContentEditor';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { Newsbar } from '@/components/Newsbar';
import { listenNewsbar, saveNewsbar } from '@/lib/firebase/website';
import { useAuth } from '@/lib/firebase/auth';

export default function NewsbarSettingsPage() {
  const router = useRouter();
  const newsbar = useWebsiteStore((s) => s.newsbar);
  const updateNewsbar = useWebsiteStore((s) => s.updateNewsbar);

  const [enabled, setEnabled] = useState(!!newsbar.enabled);
  const [primaryHtml, setPrimaryHtml] = useState<string>(newsbar.primaryHtml || '');
  const [secondaryHtml, setSecondaryHtml] = useState<string>(newsbar.secondaryHtml || '');
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const websiteUrl = useAppSettingsStore((s) => s.settings.websiteUrl || '');
  const { user } = useAuth();

  useEffect(() => {
    setEnabled(!!newsbar.enabled);
    setPrimaryHtml(newsbar.primaryHtml || '');
    setSecondaryHtml(newsbar.secondaryHtml || '');
  }, [newsbar.enabled, newsbar.primaryHtml, newsbar.secondaryHtml]);

  // Live sync from Firestore (starter integration)
  useEffect(() => {
    const unsub = listenNewsbar((doc) => {
      if (!doc) return;
      setEnabled(!!doc.enabled);
      setPrimaryHtml(doc.primaryHtml || '');
      setSecondaryHtml(doc.secondaryHtml || '');
    });
    return () => unsub();
  }, []);

  const onSave = () => {
    setError(null);
    setStatus('saving');
    try {
      updateNewsbar({ enabled, primaryHtml: (primaryHtml || '').trim(), secondaryHtml: (secondaryHtml || '').trim() });
      // Persist to Firestore
      saveNewsbar({ enabled, primaryHtml, secondaryHtml, updatedBy: user?.uid }).catch(() => {/* ignore */});
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
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/website')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconBell size={20} />
              <div>
                <Title order={2}>News Bar</Title>
                <Group gap={8}>
                  <Text c="dimmed">Top Newsbar to spotlight launches, promos, and breaking updates.</Text>
                </Group>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button onClick={onSave} loading={status === 'saving'}>Save</Button>
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <Text fw={600}>Show News Bar</Text>
              <Switch checked={enabled} onChange={(e) => setEnabled(e.currentTarget.checked)} aria-label="Toggle news bar visibility" />
            </Group>
            {enabled && (
              <>
                <Divider my={4} />
                <Stack>
                  <div>
                    <Text fw={600} mb={6}>Primary line</Text>
                    <WebContentEditor
                      placeholder="Primary message… e.g., Star Underscore — fast, elegant apps. Learn more →"
                      initialHTML={primaryHtml}
                      onChangeHTML={setPrimaryHtml}
                      defaultShowLabels={false}
                      minRows={4}
                    />
                  </div>
                  <div>
                    <Text fw={600} mb={6}>Secondary line</Text>
                    <WebContentEditor
                      placeholder="Secondary message… e.g., MIT boilerplate. Founder Express →"
                      initialHTML={secondaryHtml}
                      onChangeHTML={setSecondaryHtml}
                      defaultShowLabels={false}
                      minRows={3}
                    />
                  </div>
                </Stack>
              </>
            )}
            {error && <Alert color="red">{error}</Alert>}
            {status === 'saved' && <Alert color="green">Saved</Alert>}
          </Stack>
        </Card>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="News bar preview" size="90%" centered>
          <Stack gap={0}>
            {/* Fake browser chrome */}
            <div style={{ width: '100%', margin: '0 auto' }}>
              <div style={{
                border: '1px solid var(--mantine-color-gray-3)',
                background: 'var(--mantine-color-gray-0)',
                borderRadius: 0,
                padding: '8px 12px',
              }}>
                <Group gap={8} align="center">
                  {/* Left filler (simulated nav buttons/tab) */}
                  <Group gap={6} align="center" style={{ width: 64 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', display: 'inline-block' }} />
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', display: 'inline-block' }} />
                  </Group>
                  <div style={{ flex: 1, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, padding: '6px 10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
                    {(function() {
                      let base = 'https://yourwebsite.com';
                      try { const u = new URL(websiteUrl); base = u.origin; } catch {}
                      const path = `/`;
                      return `${base}${path}`;
                    })()}
                  </div>
                  {/* Right side window controls */}
                  <Group gap={6} align="center" justify="flex-end" style={{ width: 64 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#ff5f56', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#ffbd2e', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#27c93f', display: 'inline-block' }} />
                  </Group>
                </Group>
              </div>
            </div>

            {/* Window frame (sides + bottom outline) wrapping the site preview */}
            <div style={{ width: '100%', margin: '0 auto', borderLeft: '1px solid var(--mantine-color-gray-3)', borderRight: '1px solid var(--mantine-color-gray-3)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              {/* Preview area with current Newsbar layout */}
              <div style={{ width: '100%', background: 'var(--mantine-color-gray-0)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <div style={{ width: '100%' }}>
                  <Newsbar enabled={enabled} primaryHtml={primaryHtml} secondaryHtml={secondaryHtml} />
                </div>
              </div>

              <div style={{ padding: 0 }}>
                <div style={{ width: '100%' }}>
                  <Card withBorder style={{ borderRadius: 0 }}>
                    <Text c="dimmed" size="sm">Page content preview area</Text>
                  </Card>
                </div>
              </div>
            </div>
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
