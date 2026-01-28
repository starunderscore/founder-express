"use client";
import React, { useEffect, useState } from "react";
import { Modal, Stack, Group, Button, Text, TextInput, CopyButton } from "@mantine/core";

export type VendorDeleteModalProps = {
  opened: boolean;
  onClose: () => void;
  vendorName: string;
  onDelete: () => Promise<void> | void;
};

export default function VendorDeleteModal({ opened, onClose, vendorName, onDelete }: VendorDeleteModalProps) {
  const [input, setInput] = useState("");
  useEffect(() => { if (opened) setInput(""); }, [opened]);
  const disabled = vendorName.length > 0 && input !== vendorName;
  return (
    <Modal opened={opened} onClose={onClose} title="Permanently delete vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
      <Stack>
        <Text c="dimmed">This action cannot be undone. Type the exact vendor name to confirm permanent deletion.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Vendor name" value={vendorName} readOnly style={{ flex: 1 }} />
          <CopyButton value={vendorName}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" disabled={disabled} onClick={onDelete}>Delete</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

