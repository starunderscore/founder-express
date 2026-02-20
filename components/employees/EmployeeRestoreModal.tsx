"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function EmployeeRestoreModal({ opened, onClose, employeeName, onConfirm }: { opened: boolean; onClose: () => void; employeeName: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>Restore this employee to Active?</Text>
        <Text c="dimmed">Employee: {employeeName || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Restore</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
