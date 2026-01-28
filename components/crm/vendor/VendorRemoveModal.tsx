"use client";
import React, { useState, useEffect } from "react";
import { Modal, Stack, Group, Button, Text, TextInput, CopyButton } from "@mantine/core";

export type VendorRemoveModalProps = {
  opened: boolean;
  onClose: () => void;
  vendorName: string;
  onConfirm: () => Promise<void> | void;
};

export default function VendorRemoveModal({ opened, onClose, vendorName, onConfirm }: VendorRemoveModalProps) {
  const [input, setInput] = useState("");
  useEffect(() => { if (opened) setInput(""); }, [opened]);
  const disabled = vendorName.length > 0 && input !== vendorName;
  return (
    <Modal opened={opened} onClose={onClose} title="Remove vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
      <Stack>
        <Text c="dimmed">Move this vendor to Removed. You can permanently delete it later from the Removed tab. Type the vendor name to confirm.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Vendor name" value={vendorName} readOnly style={{ flex: 1 }} />
          <CopyButton value={vendorName}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" disabled={disabled} onClick={onConfirm}>Remove</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

