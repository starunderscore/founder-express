"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function FinanceReportsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Title order={2}>Financial reports</Title>
        <Card withBorder>
          <Text c="dimmed">Scaffolded. This will show incoming payments and revenue metrics.</Text>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

