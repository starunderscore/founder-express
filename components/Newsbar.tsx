"use client";
import { Alert, Group } from '@mantine/core';
import { useWebsiteStore } from '@/state/websiteStore';

export function Newsbar({ enabled: enabledProp, primaryHtml: primaryProp, secondaryHtml: secondaryProp }: { enabled?: boolean; primaryHtml?: string; secondaryHtml?: string } = {}) {
  const newsbar = useWebsiteStore((s) => s.newsbar);
  const enabled = typeof enabledProp === 'boolean' ? !!enabledProp : !!newsbar?.enabled;
  const primaryHtml = (typeof primaryProp === 'string' ? primaryProp : newsbar?.primaryHtml || '').trim();
  const secondaryHtml = (typeof secondaryProp === 'string' ? secondaryProp : newsbar?.secondaryHtml || '').trim();

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
