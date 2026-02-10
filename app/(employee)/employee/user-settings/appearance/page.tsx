"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, SegmentedControl, Group, Badge, ActionIcon } from '@mantine/core';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { createAppearance, listenAppearanceByUser, updateAppearance, type AppearanceSettings } from '@/services/user-settings/appearance';

export default function AppearanceSettingsPage() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const router = useRouter();
  const { user } = useAuth();
  const [record, setRecord] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenAppearanceByUser(user.uid, (row) => {
      setRecord(row);
      if (row && row.theme && row.theme !== colorScheme) {
        setColorScheme(row.theme);
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const onThemeChange = async (v: 'light' | 'dark' | 'auto') => {
    setColorScheme(v);
    if (!user) return;
    try {
      if (record) await updateAppearance(record.id, { theme: v });
      else await createAppearance({ userId: user.uid, theme: v });
    } catch (e) {
      // ignore for now; rules will enforce ownership
    }
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/user-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Appearance</Title>
            <Text c="dimmed">Customize theme and color scheme.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <div>
                <Text fw={600}>Theme</Text>
                <Text c="dimmed" size="sm">Choose light, dark, or follow system preference.</Text>
              </div>
              <Badge variant="light">Effective: {computed}</Badge>
            </Group>
            <SegmentedControl
              value={colorScheme}
              onChange={(v: any) => onThemeChange(v)}
              data={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'System', value: 'auto' },
              ]}
            />
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
