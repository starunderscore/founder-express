"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Stack } from '@mantine/core';

export default function WaitingGlobalFormPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        {null}
      </Stack>
    </EmployerAuthGate>
  );
}

