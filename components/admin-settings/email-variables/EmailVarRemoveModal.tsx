"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export function EmailVarRemoveModal({ opened, onClose, varKey, onConfirm }: { opened: boolean; onClose: () => void; varKey: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, varKey]);
  const canRemove = !!varKey && input === varKey;
  return (
    <Modal opened={opened} onClose={onClose} title="Remove variable" centered>
      <Stack>
        <Text>This will move the variable to Removed. You can restore it later or permanently delete it from there.</Text>
        <Text c="dimmed">To confirm removal, type the full variable key.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Variable key" value={varKey} readOnly style={{ flex: 1 }} />
          <CopyButton value={varKey}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type variable key" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canRemove}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default EmailVarRemoveModal;

