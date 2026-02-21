"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export default function WaitlistRemoveModal({ opened, onClose, listName, onConfirm }: { opened: boolean; onClose: () => void; listName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, listName]);
  const canRemove = !!listName && input === listName;
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>This will move the waiting list to Removed. You can restore it later or permanently delete from there.</Text>
        <Text c="dimmed">To confirm removal, type the full waiting list name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Waiting list name" value={listName} readOnly style={{ flex: 1 }} />
          <CopyButton value={listName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type waiting list name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canRemove}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
