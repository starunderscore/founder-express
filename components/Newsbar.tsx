"use client";
import { Alert, Anchor, Group } from '@mantine/core';
import { useWebsiteStore } from '@/state/websiteStore';

export function Newsbar() {
  const newsbar = useWebsiteStore((s) => s.newsbar);
  const enabled = !!newsbar?.enabled;
  const headline = newsbar?.headline?.trim() || '';
  const link = newsbar?.link?.trim() || '';

  if (!enabled || !headline) return null;

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, marginBottom: 12 }}>
      <Alert
        variant="light"
        color="indigo"
        styles={{ root: { borderRadius: 0 } }}
      >
        <Group gap={8} wrap="nowrap">
          <span style={{ fontWeight: 600 }}>{headline}</span>
          {link && (
            <Anchor href={link} target="_blank" rel="noreferrer" underline="hover" style={{ whiteSpace: 'nowrap' }}>
              Learn more →
            </Anchor>
          )}
        </Group>
      </Alert>
    </div>
  );
}

