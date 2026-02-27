"use client";
import { useEffect, useState } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import Link from 'next/link';
import { ensureDefaultCookiePolicy, getCookiePolicyEnabled, getActiveCookiePolicy } from '@/services/admin-settings/cookie-policy';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [policy, setPolicy] = useState<{ id: string; title: string; bodyHtml?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        try { await ensureDefaultCookiePolicy(); } catch {}
        const enabled = await getCookiePolicyEnabled();
        const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') : 'accepted';
        if (enabled && consent !== 'accepted') setVisible(true);
        if (enabled) {
          try { const p = await getActiveCookiePolicy(); setPolicy(p as any); } catch {}
        }
      } catch {}
    })();
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4000, padding: '12px 16px', background: 'var(--mantine-color-gray-0)', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      <Group justify="space-between" align="center">
        <Text size="sm">
          We use cookies to improve your experience. Read our{' '}
          <Link href="#" onClick={(e) => { e.preventDefault(); setModalOpen(true); }}>Cookie Policy</Link>.
        </Text>
        <Group gap="xs">
          <Button variant="default" onClick={() => setModalOpen(true)}>Learn more</Button>
          <Button onClick={() => { try { localStorage.setItem('cookie-consent', 'accepted'); } catch {} setVisible(false); }}>Accept</Button>
        </Group>
      </Group>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={policy?.title || 'Cookie Policy'} centered size="xl">
        <div dangerouslySetInnerHTML={{ __html: policy?.bodyHtml || '<p>Update your cookie policy…</p>' }} />
      </Modal>
      <style jsx global>{`
        [data-mantine-color-scheme="dark"] .cookie-banner {
          background: var(--mantine-color-dark-6);
          border-top: 1px solid var(--mantine-color-dark-7);
          color: var(--mantine-color-white);
        }
      `}</style>
    </div>
  );
}

