"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export function TagRemoveModal({ opened, onClose, tagName, onConfirm }: { opened: boolean; onClose: () => void; tagName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, tagName]);
  const canRemove = !!tagName && input === tagName;
  return (
    <Modal opened={opened} onClose={onClose} title="Remove tag" centered>
      <Stack>
        <Text>This will move the tag to Removed. You can restore it later or permanently delete from there.</Text>
        <Text c="dimmed">To confirm removal, type the full tag name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Tag name" value={tagName} readOnly style={{ flex: 1 }} />
          <CopyButton value={tagName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type tag name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canRemove}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default TagRemoveModal;

