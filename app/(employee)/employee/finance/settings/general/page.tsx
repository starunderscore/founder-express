"use client";
import { useEffect, useRef, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { Button, Card, Checkbox, Group, NumberInput, Select, Stack, Text, Title, ActionIcon } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { buildGeneralPatch, listAllowedCurrencies, readFinanceGeneral, listenFinanceGeneral, updateFinanceGeneral, type GeneralPatchInput } from '@/services/finance/general';
import { useToast } from '@/components/ToastProvider';

export default function FinanceGeneralPage() {
  const router = useRouter();
  const toast = useToast();
  const settings = useFinanceStore((s) => s.settings);
  const setCurrency = useFinanceStore((s) => s.setCurrency);
  const setGracePeriodDays = useFinanceStore((s) => s.setGracePeriodDays);
  const setEnforceTax = useFinanceStore((s) => (s as any).setEnforceTax || (() => {}));
  // Third‑party settings moved to Admin Settings → Third‑party Configuration
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    let mounted = true;
    // Prime from Firestore once, then subscribe for realtime updates
    readFinanceGeneral().then((row) => {
      if (!mounted) return;
      setCurrency(row.currency);
      setGracePeriodDays(row.gracePeriodDays);
      setEnforceTax(row.enforceTax);
      setLoading(false);
    }).catch(() => setLoading(false));

    unsubRef.current = listenFinanceGeneral((row) => {
      // Keep local store in sync with any external changes
      setCurrency(row.currency);
      setGracePeriodDays(row.gracePeriodDays);
      setEnforceTax(row.enforceTax);
    });

    return () => {
      mounted = false;
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGeneral = async (input: GeneralPatchInput) => {
    const patch = buildGeneralPatch(input);
    if (Object.keys(patch).length === 0) return;
    // Optimistic local update
    if (Object.prototype.hasOwnProperty.call(patch, 'currency') && typeof patch.currency === 'string') setCurrency(patch.currency);
    if (Object.prototype.hasOwnProperty.call(patch, 'gracePeriodDays') && typeof patch.gracePeriodDays === 'number') setGracePeriodDays(patch.gracePeriodDays);
    if (Object.prototype.hasOwnProperty.call(patch, 'enforceTax') && typeof patch.enforceTax === 'boolean') setEnforceTax(patch.enforceTax);
    try {
      await updateFinanceGeneral(patch);
      toast.show({ title: 'Saved', color: 'green', message: 'Finance settings updated.' });
    } catch (e) {
      toast.show({ title: 'Save failed', color: 'red', message: 'Could not update settings.' });
    }
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconAdjustments size={20} />
              <div>
                <Title order={2}>General</Title>
                <Text c="dimmed">Financial configurations.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Financial configurations</Text>
            <Group grow>
              <Select
                label="Default currency"
                data={listAllowedCurrencies()}
                value={settings.currency}
                onChange={(v) => updateGeneral({ currency: v || settings.currency })}
                allowDeselect={false}
              />
            </Group>
            <NumberInput
              label="Grace period (days)"
              description="Days after the due date before an invoice is considered late."
              value={settings.gracePeriodDays}
              onChange={(v) => updateGeneral({ gracePeriodDays: v as any })}
              min={0}
              step={1}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Tax compliance</Text>
            <Checkbox
              label="Auto-apply enabled taxes to new invoices"
              description="Applies all enabled taxes by default; you can remove them per invoice."
              checked={settings.enforceTax}
              onChange={(e) => updateGeneral({ enforceTax: e.currentTarget.checked })}
            />
          </Stack>
        </Card>

        {loading ? <Text c="dimmed" size="sm">Loading finance settings…</Text> : null}
      </Stack>
    </EmployerAuthGate>
  );
}
