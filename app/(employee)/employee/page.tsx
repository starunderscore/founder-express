"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Group, Stack, Text, Title, Badge, Button, ActionIcon, Modal, Tooltip as MantineTooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchUserCountsSummary, fetchUserSignupsByWeek } from '@/lib/firebase/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { listNewsletters } from '@/services/email-subscriptions/newsletters';
import { useFinanceStore } from '@/state/financeStore';

export default function EmployerDashboardPage() {
  const [source, setSource] = useState<'firebase' | 'demo'>('demo');
  const [summary, setSummary] = useState<{ total: number; dau: number; wau: number; mau: number } | null>(null);
  const [series, setSeries] = useState<{ week: string; signups: number }[] | null>(null);

  const [newslettersSent, setNewslettersSent] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const rows = await listNewsletters();
        setNewslettersSent(rows.filter((n) => n.status === 'Sent').length);
      } catch {}
    })();
  }, []);

  const finance = useFinanceStore((s) => ({ invoicesCount: s.invoices.length }));

  const [dauOpen, setDauOpen] = useState(false);
  const [wauOpen, setWauOpen] = useState(false);
  const [mauOpen, setMauOpen] = useState(false);

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
              <Group gap={6} align="center">
                <Text c="dimmed" size="sm">DAU</Text>
                <MantineTooltip label="What is DAU?" withArrow>
                  <ActionIcon variant="subtle" size="sm" aria-label="What is DAU?" onClick={() => setDauOpen(true)}>
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </MantineTooltip>
              </Group>
              <Title order={3}>{summary?.dau ?? '—'}</Title>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Group gap={6} align="center">
                <Text c="dimmed" size="sm">WAU</Text>
                <MantineTooltip label="What is WAU?" withArrow>
                  <ActionIcon variant="subtle" size="sm" aria-label="What is WAU?" onClick={() => setWauOpen(true)}>
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </MantineTooltip>
              </Group>
              <Title order={3}>{summary?.wau ?? '—'}</Title>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack gap={2}>
              <Group gap={6} align="center">
                <Text c="dimmed" size="sm">MAU</Text>
                <MantineTooltip label="What is MAU?" withArrow>
                  <ActionIcon variant="subtle" size="sm" aria-label="What is MAU?" onClick={() => setMauOpen(true)}>
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </MantineTooltip>
              </Group>
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
              <Title order={3}>—</Title>
              <Text size="sm" c="dimmed">Waitlists: — · Newsletters sent: {newslettersSent}</Text>
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
      <Modal opened={dauOpen} onClose={() => setDauOpen(false)} title="Daily Active Users (DAU)" centered>
        <Stack gap={8}>
          <Text size="sm">DAU is the number of unique users who were active in the last day.</Text>
          <Text size="sm" c="dimmed">In this app, “active” means their profile’s lastActiveAt is within the past 24 hours.</Text>
        </Stack>
      </Modal>
      <Modal opened={wauOpen} onClose={() => setWauOpen(false)} title="Weekly Active Users (WAU)" centered>
        <Stack gap={8}>
          <Text size="sm">WAU is the number of unique users who were active in the last 7 days.</Text>
          <Text size="sm" c="dimmed">Calculated using lastActiveAt within the past 7 days.</Text>
        </Stack>
      </Modal>
      <Modal opened={mauOpen} onClose={() => setMauOpen(false)} title="Monthly Active Users (MAU)" centered>
        <Stack gap={8}>
          <Text size="sm">MAU is the number of unique users who were active in the last 30 days.</Text>
          <Text size="sm" c="dimmed">Calculated using lastActiveAt within the past 30 days.</Text>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
