"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export function TagDeletePermanentModal({ opened, onClose, tagName, onConfirm }: { opened: boolean; onClose: () => void; tagName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, tagName]);
  const canDelete = !!tagName && input === tagName;
  return (
    <Modal opened={opened} onClose={onClose} title="Permanently delete tag" centered>
      <Stack>
        <Text color="red">This action permanently deletes the tag and cannot be undone.</Text>
        <Text c="dimmed">To confirm, type the full tag name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Tag name" value={tagName} readOnly style={{ flex: 1 }} />
          <CopyButton value={tagName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type tag name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canDelete}>Delete permanently</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default TagDeletePermanentModal;

