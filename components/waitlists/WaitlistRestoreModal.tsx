"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function WaitlistRestoreModal({ opened, onClose, listName, onConfirm }: { opened: boolean; onClose: () => void; listName: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>Restore this waiting list to Active?</Text>
        <Text c="dimmed">Waiting list: {listName || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Restore</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
