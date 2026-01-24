"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card, SimpleGrid, Group, Badge } from '@mantine/core';

export default function AnalyticsPage() {
  return (
    <AuthGate>
      <div>
        <Group justify="space-between" align="center" mb="xs">
          <Title order={2}>Analytics</Title>
          <Badge color="gray" variant="light">Coming soon</Badge>
        </Group>
        <Text c="dimmed" mb="md">Your typing performance and trends.</Text>
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Card withBorder p="lg">WPM over time</Card>
            <Card withBorder p="lg">Accuracy breakdown</Card>
          </SimpleGrid>
        </div>
      </div>
    </AuthGate>
  );
}
