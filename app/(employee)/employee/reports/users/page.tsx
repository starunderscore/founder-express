"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Badge, Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { fetchUserCountsSummary, fetchTopCountries, fetchSignupsCountBetween } from '@/lib/firebase/analytics';

export default function ReportsUsersPage() {
  const [source, setSource] = useState<'firebase' | 'sample'>('sample');
  const [summary, setSummary] = useState<{ total: number; dau: number; wau: number; mau: number } | null>(null);
  const [countries, setCountries] = useState<{ country: string; count: number }[] | null>(null);
  const [growth, setGrowth] = useState<{ last30: number; prev30: number; pct: number } | null>(null);

  useEffect(() => {
    const hasFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const load = async () => {
      if (hasFirebase) {
        const s = await fetchUserCountsSummary();
        const c = await fetchTopCountries(5);
        // 30d growth
        const now = new Date();
        const startLast30 = new Date(now); startLast30.setDate(startLast30.getDate() - 30);
        const startPrev30 = new Date(now); startPrev30.setDate(startPrev30.getDate() - 60);
        const last30 = await fetchSignupsCountBetween(startLast30, now).catch(() => null);
        const prev30 = await fetchSignupsCountBetween(startPrev30, startLast30).catch(() => null);
        if (s) setSummary(s);
        if (c) setCountries(c);
        if (last30 != null && prev30 != null) {
          const pct = prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);
          setGrowth({ last30, prev30, pct });
        }
        if (s || c) setSource('firebase');
        return;
      }
      // Sample fallback
      setSummary({ total: 5234, dau: 178, wau: 956, mau: 3210 });
      setCountries([
        { country: 'United States', count: 2100 },
        { country: 'Canada', count: 540 },
        { country: 'United Kingdom', count: 480 },
        { country: 'Germany', count: 420 },
        { country: 'Australia', count: 360 },
      ]);
      const last30 = 820; const prev30 = 670; const pct = Math.round(((last30 - prev30) / prev30) * 100);
      setGrowth({ last30, prev30, pct });
      setSource('sample');
    };
    load();
  }, []);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2} mb={4}>User reports</Title>
            <Text c="dimmed">Investor snapshot: growth and engagement at a glance.</Text>
          </div>
          <Badge variant="light" color={source === 'firebase' ? 'green' : 'gray'}>{source === 'firebase' ? 'Live (Firebase)' : 'Demo'}</Badge>
        </Group>

        <Group grow>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">Total users</Text>
              <Title order={3}>{summary?.total ?? '—'}</Title>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">DAU</Text>
              <Title order={3}>{summary?.dau ?? '—'}</Title>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">WAU</Text>
              <Title order={3}>{summary?.wau ?? '—'}</Title>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">MAU</Text>
              <Title order={3}>{summary?.mau ?? '—'}</Title>
            </Stack>
          </Card>
        </Group>

        <Group grow>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">New users (last 30 days)</Text>
              <Title order={3}>{growth?.last30 ?? '—'}</Title>
              <Text size="sm" c={((growth?.pct ?? 0) >= 0) ? 'green' : 'red'}>
                {growth ? `${growth.pct >= 0 ? '+' : ''}${growth.pct}% vs prior 30d` : '—'}
              </Text>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">Prior 30 days</Text>
              <Title order={3}>{growth?.prev30 ?? '—'}</Title>
              <Text size="sm" c="dimmed">Baseline period</Text>
            </Stack>
          </Card>
        </Group>

        <Card withBorder>
          <Text fw={600} mb={6}>Top countries</Text>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th>Users</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(countries || []).map((c) => (
                <Table.Tr key={c.country}>
                  <Table.Td>{c.country}</Table.Td>
                  <Table.Td>{c.count}</Table.Td>
                </Table.Tr>
              ))}
              {!countries && (
                <Table.Tr>
                  <Table.Td colSpan={2}><Text c="dimmed">Loading…</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Signups over time</Title>
              <Text c="dimmed" size="sm">Weekly user joins trend.</Text>
            </div>
            <Button component={Link as any} href="/employee/reports/users/signups" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Churn</Title>
              <Text c="dimmed" size="sm">Placeholder only (no link).</Text>
            </div>
            <Button variant="light" disabled>Disabled</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
