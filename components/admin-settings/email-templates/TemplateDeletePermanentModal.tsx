"use client";
import { useEffect, useState } from 'react';
import { Button, CopyButton, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

export default function TemplateDeletePermanentModal({ opened, onClose, templateName, onConfirm }: { opened: boolean; onClose: () => void; templateName: string; onConfirm: () => void | Promise<void>; }) {
  const [input, setInput] = useState('');
  useEffect(() => { if (opened) setInput(''); }, [opened, templateName]);
  const canDelete = !!templateName && input === templateName;
  return (
    <Modal opened={opened} onClose={onClose} title="Permanently delete template" centered>
      <Stack>
        <Text color="red">This action permanently deletes the template and cannot be undone.</Text>
        <Text c="dimmed">To confirm, type the full template name.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Template name" value={templateName} readOnly style={{ flex: 1 }} />
          <CopyButton value={templateName}>{({ copied, copy }) => (
            <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          )}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type template name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm} disabled={!canDelete}>Delete permanently</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

