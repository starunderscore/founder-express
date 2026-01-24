"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Group, Stack, Text, Title, Badge, Button } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchUserCountsSummary, fetchUserSignupsByWeek } from '@/lib/firebase/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { useFinanceStore } from '@/state/financeStore';

export default function EmployerDashboardPage() {
  const [source, setSource] = useState<'firebase' | 'demo'>('demo');
  const [summary, setSummary] = useState<{ total: number; dau: number; wau: number; mau: number } | null>(null);
  const [series, setSeries] = useState<{ week: string; signups: number }[] | null>(null);

  const email = useSubscriptionsStore((s) => ({
    waitlists: s.waitlists.length,
    subscribers: s.emailList.length,
    newslettersSent: s.newsletters.filter((n) => n.status === 'Sent').length,
  }));

  const finance = useFinanceStore((s) => ({ invoicesCount: s.invoices.length }));

  useEffect(() => {
    const hasFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const load = async () => {
      if (hasFirebase) {
        const s = await fetchUserCountsSummary();
        const ser = await fetchUserSignupsByWeek(8);
        if (s) setSummary(s);
        if (ser) setSeries(ser);
        if (s || ser) setSource('firebase');
        else setFallback();
        return;
      }
      setFallback();
    };
    const setFallback = () => {
      setSummary({ total: 5234, dau: 178, wau: 956, mau: 3210 });
      const now = new Date();
      const demo: { week: string; signups: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i * 7);
        demo.push({ week: `${d.getMonth() + 1}/${d.getDate()}` , signups: Math.max(0, Math.round(20 + 10 * Math.sin(i) + (Math.random()*4-2))) });
      }
      setSeries(demo);
      setSource('demo');
    };
    load();
  }, []);

  const maxY = useMemo(() => (series ? Math.max(1, ...series.map((d) => d.signups)) : 10), [series]);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2} mb={4}>Employee Dashboard</Title>
            <Text c="dimmed">Key signals at a glance.</Text>
          </div>
          <Badge variant="light" color={source === 'firebase' ? 'green' : 'gray'}>{source === 'firebase' ? 'Live' : 'Demo'}</Badge>
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

        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>User signups (last 8 weeks)</Text>
            <Button component={Link as any} href="/employee/reports/users/signups" variant="light" size="xs">Open report</Button>
          </Group>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, Math.ceil((maxY + 5) / 5) * 5]} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ stroke: '#888', strokeDasharray: '3 3' }} />
              <Line type="monotone" dataKey="signups" stroke="#228be6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Group grow>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">Email subscribers</Text>
              <Title order={3}>{email.subscribers}</Title>
              <Text size="sm" c="dimmed">Waitlists: {email.waitlists} · Newsletters sent: {email.newslettersSent}</Text>
              <Group gap={6}>
                <Button component={Link as any} href="/employee/email-subscriptions" variant="light" size="xs">Open email</Button>
              </Group>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Text c="dimmed" size="sm">Invoices</Text>
              <Title order={3}>{finance.invoicesCount}</Title>
              <Text size="sm" c="dimmed">Count only</Text>
              <Group gap={6}>
                <Button component={Link as any} href="/employee/finance/invoices" variant="light" size="xs">Open invoices</Button>
              </Group>
            </Stack>
          </Card>
        </Group>
      </Stack>
    </EmployerAuthGate>
  );
}
