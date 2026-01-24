"use client";
import { AuthGate } from '@/components/AuthGate';
import { PatternTypingCanvas } from '@/components/PatternTypingCanvas';
import { useSessionStore } from '@/state/store';
import { selectors } from '@/state/selectors';
import { Title, Text } from '@mantine/core';

export default function PracticePage() {
  const mode = useSessionStore(selectors.mode);
  return (
    <AuthGate>
      <div>
        <Title order={2} mb="xs">Practice</Title>
        <Text c="dimmed" mb="md">Mode: {mode}</Text>
        <PatternTypingCanvas />
      </div>
    </AuthGate>
  );
}

