"use client";
import { AuthGate } from '@/components/AuthGate';
import { Title, Text, Card, Stack, SegmentedControl, Group, Badge } from '@mantine/core';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

export default function SettingsPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');

  return (
    <AuthGate>
      <div>
        <Title order={2} mb="xs">Settings</Title>
        <Text c="dimmed" mb="md">Personalize your experience.</Text>

        <Card withBorder p="lg" mb="md">
          <Stack>
            <div>
              <Group justify="space-between" mb={6}>
                <Text fw={600}>Appearance</Text>
                <Badge variant="light">{computed === 'dark' ? 'Dark' : 'Light'}</Badge>
              </Group>
              <Text size="sm" c="dimmed" mb="sm">Choose light, dark, or follow your system setting.</Text>
              <SegmentedControl
                value={getSegmentValue(colorScheme)}
                onChange={(v) => setColorScheme(mapSegmentToScheme(v))}
                data={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'System', value: 'system' },
                ]}
              />
            </div>
          </Stack>
        </Card>
      </div>
    </AuthGate>
  );
}

function getSegmentValue(cs: string) {
  if (cs === 'auto') return 'system';
  return cs;
}

function mapSegmentToScheme(v: string): 'light' | 'dark' | 'auto' {
  if (v === 'system') return 'auto';
  return v as 'light' | 'dark';
}
