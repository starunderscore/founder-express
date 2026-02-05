"use client";
import Link from 'next/link';
import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { ReactNode } from 'react';

type BadgeSpec = { label: string; color?: string };

export function AdminDisconnectedCard({
  title,
  subtitle,
  badges,
  actionLabel,
  actionHref,
  actionOnClick,
  children,
}: {
  title: string;
  subtitle?: string;
  badges?: BadgeSpec[];
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <Card withBorder style={{ borderColor: 'var(--mantine-color-red-5)', background: 'var(--mantine-color-red-0)' }}>
      <Stack>
        <Group justify="space-between" align="center">
          <div>
            <Title order={3} style={{ marginBottom: 2 }}>{title}</Title>
            {subtitle && <Text c="dimmed" size="sm">{subtitle}</Text>}
          </div>
          {actionLabel && actionHref && (
            <Button component={Link as any} href={actionHref} variant="light">{actionLabel}</Button>
          )}
          {actionLabel && !actionHref && actionOnClick && (
            <Button variant="light" onClick={actionOnClick}>{actionLabel}</Button>
          )}
        </Group>
        {!!badges?.length && (
          <Group>
            {badges.map((b, i) => (
              <Badge key={i} color={b.color || 'gray'} variant="light">{b.label}</Badge>
            ))}
          </Group>
        )}
        {children}
      </Stack>
    </Card>
  );
}

