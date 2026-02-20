"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export function RoleRemoveModal({ opened, onClose, roleName, onConfirm }: { opened: boolean; onClose: () => void; roleName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, roleName]);
  const canRemove = !!roleName && input === roleName;
  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
      <Stack>
        <Text>This will move the role to Removed. You can restore it later or permanently delete from there.</Text>
        <Text c="dimmed">To confirm removal, type the full role name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Role name" value={roleName} readOnly style={{ flex: 1 }} />
          <CopyButton value={roleName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type role name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canRemove}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default RoleRemoveModal;
