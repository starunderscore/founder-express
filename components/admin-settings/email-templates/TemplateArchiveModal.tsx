"use client";
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function TemplateArchiveModal({ opened, onClose, templateName, onConfirm }: { opened: boolean; onClose: () => void; templateName: string; onConfirm: () => void | Promise<void>; }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Archive template" centered>
      <Stack>
        <Text>Archive this template? It will move to Archive and can be restored later.</Text>
        <Text c="dimmed">Template: {templateName || '—'}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Archive</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

