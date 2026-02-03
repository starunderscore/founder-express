"use client";
import { useEffect, useState } from 'react';
import { Alert, Group } from '@mantine/core';
import { listenNewsbar } from '@/lib/firebase/website';

type Props = { enabled?: boolean; primaryHtml?: string; secondaryHtml?: string };

const FALLBACK = {
  enabled: true,
  primaryHtml:
    '<strong>Star Underscore — fast, elegant apps.</strong> <a href="https://starunderscore.com" target="_blank" rel="noreferrer">Learn more →</a>',
  secondaryHtml:
    '<strong>MIT boilerplate</strong> &nbsp; <a href="https://github.com/starunderscore/founder-express" target="_blank" rel="noreferrer">Founder Express →</a>',
};

export function Newsbar({ enabled: enabledProp, primaryHtml: primaryProp, secondaryHtml: secondaryProp }: Props = {}) {
  const [liveEnabled, setLiveEnabled] = useState<boolean | undefined>(undefined);
  const [livePrimary, setLivePrimary] = useState<string>('');
  const [liveSecondary, setLiveSecondary] = useState<string>('');

  useEffect(() => {
    const unsub = listenNewsbar((doc) => {
      if (!doc) {
        setLiveEnabled(undefined);
        setLivePrimary('');
        setLiveSecondary('');
      } else {
        setLiveEnabled(!!doc.enabled);
        setLivePrimary((doc.primaryHtml || '').trim());
        setLiveSecondary((doc.secondaryHtml || '').trim());
      }
    });
    return () => unsub();
  }, []);

  const enabled = typeof enabledProp === 'boolean' ? !!enabledProp : (typeof liveEnabled === 'boolean' ? liveEnabled : FALLBACK.enabled);
  const primaryHtml = (typeof primaryProp === 'string' ? primaryProp : (livePrimary || FALLBACK.primaryHtml)).trim();
  const secondaryHtml = (typeof secondaryProp === 'string' ? secondaryProp : (liveSecondary || FALLBACK.secondaryHtml)).trim();

  if (!enabled || (!primaryHtml && !secondaryHtml)) return null;

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, marginBottom: 0 }}>
      <Alert variant="light" color="indigo" styles={{ root: { borderRadius: 0 } }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          {primaryHtml && (
            <div className="newsbar-primary" dangerouslySetInnerHTML={{ __html: primaryHtml }} />
          )}
          {secondaryHtml && (
            <div className="newsbar-secondary" style={{ marginLeft: 'auto' }} dangerouslySetInnerHTML={{ __html: secondaryHtml }} />
          )}
        </Group>
      </Alert>
    </div>
  );
}
