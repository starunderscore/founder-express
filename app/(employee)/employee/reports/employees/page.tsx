"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function ReportsEmployeesPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Title order={2}>Employee reports</Title>
        <Card withBorder>
          <Text c="dimmed">Scaffolded. This will show join/leave events and trends.</Text>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

