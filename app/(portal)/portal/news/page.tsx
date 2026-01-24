"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card } from '@mantine/core';

export default function NewsPage() {
  return (
    <AuthGate>
      <div>
        <Title order={2} mb="xs">News</Title>
        <Text c="dimmed" mb="md">Latest updates and release notes.</Text>
        <Card withBorder p="lg">No news yet.</Card>
      </div>
    </AuthGate>
  );
}

