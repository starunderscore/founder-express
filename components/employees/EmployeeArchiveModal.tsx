"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function EmployeeArchiveModal({ opened, onClose, employeeName, onConfirm }: { opened: boolean; onClose: () => void; employeeName: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>Archive this employee? They will move to Archive and can be restored later.</Text>
        <Text c="dimmed">Employee: {employeeName || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Archive</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
