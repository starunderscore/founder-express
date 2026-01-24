"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function ReportsTagsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Title order={2}>Tag activity</Title>
        <Card withBorder>
          <Text c="dimmed">Scaffolded. This will show tag usage and activity by tagged accounts.</Text>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

