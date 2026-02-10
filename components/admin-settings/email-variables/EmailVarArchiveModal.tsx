"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function EmailVarArchiveModal({ opened, onClose, varKey, onConfirm }: { opened: boolean; onClose: () => void; varKey: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Archive variable" centered>
      <Stack>
        <Text>Archive this variable? It will move to Archive and can be restored later.</Text>
        <Text c="dimmed">Variable: {varKey || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Archive</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

