"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function WaitlistArchiveModal({ opened, onClose, listName, onConfirm }: { opened: boolean; onClose: () => void; listName: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>Archive this waiting list? It will move to Archive and can be restored later.</Text>
        <Text c="dimmed">Waiting list: {listName || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Archive</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
