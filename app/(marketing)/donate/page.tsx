"use client";
import { useState } from 'react';
import { Container, Title, Text, SegmentedControl, Group, Button, NumberInput, Card, Stack, Alert } from '@mantine/core';

export default function DonatePage() {
  const [interval, setInterval] = useState<'one_time' | 'monthly'>('one_time');
  const [amount, setAmount] = useState<number | ''>(10);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleAmountChange = (v: string | number) => {
    if (typeof v === 'number') {
      setAmount(v);
    } else if (v === '') {
      setAmount('');
    } else {
      const n = parseFloat(v);
      setAmount(Number.isNaN(n) ? '' : n);
    }
  };

  const submit = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/donate/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: typeof amount === 'number' ? amount : 0, interval }),
      });
      if (res.status === 501) {
        setStatus('ready');
        setMessage('Donations are not configured yet. Please check back soon.');
        return;
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        setStatus('error');
        setMessage('Failed to initiate donation.');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Error initiating donation');
    }
  };

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xs">Support development</Title>
      <Text c="dimmed" mb="md">Anonymous donations — one-time or monthly</Text>
      <Card withBorder p="lg">
        <Stack>
          <Group justify="space-between" align="center">
            <SegmentedControl
              value={interval}
              onChange={(v) => setInterval(v as any)}
              data={[
                { label: 'One‑time', value: 'one_time' },
                { label: 'Monthly', value: 'monthly' },
              ]}
            />
            <NumberInput
              label="Amount"
              prefix="$"
              min={1}
              step={1}
              value={amount}
              onChange={handleAmountChange}
              style={{ width: 160 }}
            />
          </Group>
          <Group>
            {[5, 10, 25, 50].map((v) => (
              <Button key={v} variant={amount === v ? 'filled' : 'default'} onClick={() => setAmount(v)}>
                ${v}
              </Button>
            ))}
          </Group>
          {message && (
            <Alert color={status === 'error' ? 'red' : 'blue'}>{message}</Alert>
          )}
          <Button onClick={submit} loading={status === 'loading'}>Donate {typeof amount === 'number' ? `$${amount}` : ''} {interval === 'monthly' ? 'monthly' : 'once'}</Button>
          <Text size="xs" c="dimmed">We do not collect personal information for anonymous donations. Payment processing provided by your selected provider.</Text>
        </Stack>
      </Card>
    </Container>
  );
}
