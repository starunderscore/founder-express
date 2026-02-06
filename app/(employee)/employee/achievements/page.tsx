"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useState } from 'react';
import { Title, Text, Card, SimpleGrid, Group, TextInput, Button, Stack } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';

type Achievement = { id: string; name: string; icon: string };

const defaultAchievements: Achievement[] = [
  { id: 'ach-first-login', name: 'First Login', icon: '🔑' },
  { id: 'ach-10-sessions', name: '10 Sessions', icon: '🔥' },
  { id: 'ach-perfect-score', name: 'Perfect Score', icon: '🏆' },
];

export default function EmployerAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAchievements((list) => [{ id: `ach-${Date.now()}`, name: name.trim(), icon: icon.trim() || '⭐' }, ...list]);
    setName('');
    setIcon('⭐');
  };

  return (
    <EmployerAuthGate>
      <Group gap="xs" align="center" mb="md">
        <IconTrophy size={20} />
        <div>
          <Title order={2} mb={4}>Achievements</Title>
          <Text c="dimmed">Reward clients with sticker-like achievements.</Text>
        </div>
      </Group>

      <Card withBorder mb="md">
        <form onSubmit={onAdd}>
          <Stack gap="xs">
            <Group align="end">
              <TextInput label="Icon (emoji)" value={icon} onChange={(e) => setIcon(e.currentTarget.value)} style={{ width: 140 }} />
              <TextInput label="Name" placeholder="e.g. Power User" value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
              <Button type="submit">Add</Button>
            </Group>
          </Stack>
        </form>
      </Card>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
        {achievements.map((a) => (
          <Card key={a.id} withBorder>
            <Group>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{a.icon}</span>
              <Text fw={600}>{a.name}</Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </EmployerAuthGate>
  );
}
