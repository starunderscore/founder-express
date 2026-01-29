"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function DashboardPage() {
  return (
    <AuthGate>
      <Card withBorder>
        <Stack>
          <Title order={2}>Client portal</Title>
          <Text c="dimmed">This space is intentionally bare. Add your client‑facing features here.</Text>
        </Stack>
      </Card>
    </AuthGate>
  );
}
