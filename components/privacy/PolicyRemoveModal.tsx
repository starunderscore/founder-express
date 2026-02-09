"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export function PolicyRemoveModal({ opened, onClose, policyTitle, onConfirm }: { opened: boolean; onClose: () => void; policyTitle: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, policyTitle]);
  const canRemove = !!policyTitle && input === policyTitle;
  return (
    <Modal opened={opened} onClose={onClose} title="Remove policy" centered>
      <Stack>
        <Text>This moves the policy to Removed. You can restore it later or permanently delete from there.</Text>
        <Text c="dimmed">To confirm removal, type the full policy title.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Policy title" value={policyTitle} readOnly style={{ flex: 1 }} />
          <CopyButton value={policyTitle}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type policy title" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canRemove}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default PolicyRemoveModal;

