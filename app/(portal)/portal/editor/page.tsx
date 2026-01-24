"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card, Group, Button } from '@mantine/core';
import Link from 'next/link';

export default function EditorPage() {
  return (
    <AuthGate>
      <div>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2}>Library Editor</Title>
            <Text c="dimmed" size="sm">Create and edit your pattern libraries</Text>
          </div>
          <Button component={Link} href="/portal" variant="default">Back to Libraries</Button>
        </Group>
        <Card withBorder p="lg">Editor coming soon…</Card>
      </div>
    </AuthGate>
  );
}

