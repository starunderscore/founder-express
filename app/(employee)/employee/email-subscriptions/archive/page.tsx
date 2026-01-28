"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Badge, Tabs, Anchor, Button } from '@mantine/core';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';

export default function EmailSubscriptionsArchivePage() {
  const waitlists = useSubscriptionsStore((s) => s.waitlists);

  const archived = (waitlists || []).filter((w: any) => !!w?.isArchived);

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <RouteTabs
          value={"archive"}
          tabs={[
            { value: 'newsletters', label: 'Newsletters', href: '/employee/email-subscriptions/newsletters' },
            { value: 'waiting', label: 'Waiting Lists', href: '/employee/email-subscriptions/waiting' },
            { value: 'archive', label: 'Archive', href: '/employee/email-subscriptions/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/email-subscriptions/removed' },
          ]}
        />

        <Card withBorder>
          {archived.length > 0 ? (
            <Stack>
              {archived.map((b: any) => (
                <Card key={b.id} withBorder>
                  <Group justify="space-between">
                    <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`} underline="hover">
                      <Text fw={600}>{b.name}</Text>
                    </Anchor>
                    <Badge variant="light" color="gray">archived</Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No archived waiting lists</Text>
          )}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
