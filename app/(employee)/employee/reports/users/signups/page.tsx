"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, ActionIcon, Badge, Button, Select } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { fetchUserSignupsByWeek } from '@/lib/firebase/analytics';

const generateWeeklyData = (weeks: number) => {
  const now = new Date();
  const data: { week: string; signups: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    // Dummy pattern
    const signups = Math.max(0, Math.round(20 + 10 * Math.sin(i / 2) + (Math.random() * 6 - 3)));
    data.push({ week: label, signups });
  }
  return data;
};

export default function UserSignupsReportPage() {
  const router = useRouter();
  const [data, setData] = useState<{ week: string; signups: number }[] | null>(null);
  const [source, setSource] = useState<'firebase' | 'sample'>('sample');
  const [weeks, setWeeks] = useState<string>('12');

  useEffect(() => {
    const hasFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const load = async () => {
      const n = parseInt(weeks || '12', 10) || 12;
      if (hasFirebase) {
        const series = await fetchUserSignupsByWeek(n);
        if (series && series.some((d) => d.signups > 0)) {
          setData(series);
          setSource('firebase');
          return;
        }
      }
      setData(generateWeeklyData(parseInt(weeks || '12', 10) || 12));
      setSource('sample');
    };
    load();
  }, [weeks]);

  const maxY = useMemo(() => (data ? Math.max(1, ...data.map((d) => d.signups)) : 10), [data]);
  const metrics = useMemo(() => {
    const series = data || [];
    if (series.length === 0) return { lastWeek: 0, prevWeek: 0, wow: 0, last4w: 0 };
    const lastWeek = series[series.length - 1]?.signups || 0;
    const prevWeek = series[series.length - 2]?.signups || 0;
    const last4w = series.slice(-4).reduce((a, b) => a + b.signups, 0);
    const wow = prevWeek === 0 ? (lastWeek > 0 ? 100 : 0) : Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
    return { lastWeek, prevWeek, wow, last4w };
  }, [data]);

  const exportCsv = (rows: { week: string; signups: number }[]) => {
    const header = 'week,signups\n';
    const body = rows.map((r) => `${r.week},${r.signups}`).join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-signups-${weeks}-weeks.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" mb="md">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/reports/users')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Signups over time</Title>
              <Text c="dimmed">Weekly user joins (dummy data)</Text>
            </div>
          </Group>
        </Group>

        <Group grow>
          <Card withBorder>
            <Stack gap={2}>
              <Text size="sm" c="dimmed">Signups (last week)</Text>
              <Title order={3}>{metrics.lastWeek}</Title>
              <Text size="sm" c={metrics.wow >= 0 ? 'green' : 'red'}>{metrics.wow >= 0 ? '+' : ''}{metrics.wow}% WoW</Text>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text size="sm" c="dimmed">Signups (last 4 weeks)</Text>
              <Title order={3}>{metrics.last4w}</Title>
              <Text size="sm" c="dimmed">Rolling period</Text>
            </Stack>
          </Card>
        </Group>

        <Card withBorder style={{ minHeight: 360 }}>
          <Group justify="space-between" mb="xs" align="center">
            <Text c="dimmed" size="sm">Data source: {source === 'firebase' ? 'Firebase' : 'Sample (demo)'}</Text>
            <Group gap="xs">
              <Select
                size="xs"
                label="Range"
                data={[
                  { value: '4', label: '4 weeks' },
                  { value: '8', label: '8 weeks' },
                  { value: '12', label: '12 weeks' },
                  { value: '24', label: '24 weeks' },
                ]}
                value={weeks}
                onChange={(v) => setWeeks(v || '12')}
                w={120}
              />
              <Button size="xs" variant="light" onClick={() => exportCsv(data || [])}>Export CSV</Button>
              <Badge variant="light" color={source === 'firebase' ? 'green' : 'gray'}>{source === 'firebase' ? 'Live' : 'Demo'}</Badge>
            </Group>
          </Group>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, Math.ceil((maxY + 5) / 5) * 5]} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ stroke: '#888', strokeDasharray: '3 3' }} />
              <Line type="monotone" dataKey="signups" stroke="#228be6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
