"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack } from '@mantine/core';

export default function ReportsAchievementsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Title order={2}>Achievements reports (dummy)</Title>
        <Card withBorder>
          <Text c="dimmed">This is placeholder content with dummy data. Replace with real metrics later.</Text>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

