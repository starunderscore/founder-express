"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function ReportsEmailsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Title order={2}>Email reports</Title>
        <Card withBorder>
          <Text c="dimmed">Scaffolded. This will show newsletters performance and waiting list sends.</Text>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

