"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export default function WaitlistDeletePermanentModal({ opened, onClose, listName, onConfirm }: { opened: boolean; onClose: () => void; listName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, listName]);
  const canDelete = !!listName && input === listName;
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text color="red">This action permanently deletes the waiting list and cannot be undone.</Text>
        <Text c="dimmed">To confirm, type the full waiting list name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Waiting list name" value={listName} readOnly style={{ flex: 1 }} />
          <CopyButton value={listName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type waiting list name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canDelete}>Delete permanently</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
