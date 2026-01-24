"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Badge, Tabs, Anchor, Button } from '@mantine/core';
import Link from 'next/link';

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

        <Tabs value={"archive"}>
          <Tabs.List>
            <Tabs.Tab value="newsletters" component={Link as any} href={"/employee/email-subscriptions/newsletters" as any}>Newsletters</Tabs.Tab>
            <Tabs.Tab value="waiting" component={Link as any} href={"/employee/email-subscriptions/waiting" as any}>Waiting Lists</Tabs.Tab>
            <Tabs.Tab value="archive" component={Link as any} href={"/employee/email-subscriptions/archive" as any}>Archive</Tabs.Tab>
            <Tabs.Tab value="removed" component={Link as any} href={"/employee/email-subscriptions/removed" as any}>Removed</Tabs.Tab>
          </Tabs.List>
        </Tabs>

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
