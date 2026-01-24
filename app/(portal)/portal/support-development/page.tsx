"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card, Button, Group, Stack, List } from '@mantine/core';
import Link from 'next/link';

export default function SupportDevelopmentPage() {
  return (
    <AuthGate>
      <div>
        <Title order={2} mb="xs">Support development</Title>
        <Text c="dimmed" mb="md">Help us build better typing tools.</Text>
        <Card withBorder p="lg">
          <Stack>
            <Group>
              <Button variant="light" component={Link} href="/donate">Donate</Button>
              <Button variant="default" component={Link} href="/portal/editor">Share feedback</Button>
            </Group>
            <Stack gap={6}>
              <Text fw={600}>About feature blocks</Text>
              <Text size="sm" c="dimmed">
                Add a feature block by fencing text with <code>{'``` typing'}</code> in Markdown.
              </Text>
              <Text size="sm" c="dimmed">They help you:</Text>
              <List size="sm" spacing={4} c="dimmed">
                <List.Item>Practice exactly what’s inside the block</List.Item>
                <List.Item>Organize pages into chapters like a book</List.Item>
              </List>
            </Stack>
          </Stack>
        </Card>
      </div>
    </AuthGate>
  );
}
