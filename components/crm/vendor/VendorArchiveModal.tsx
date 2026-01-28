"use client";
import React, { useEffect, useState } from "react";
import { Modal, Stack, Group, Button, Text, TextInput, CopyButton } from "@mantine/core";

export type VendorArchiveModalProps = {
  opened: boolean;
  onClose: () => void;
  vendorName: string;
  onArchive: () => Promise<void> | void;
};

export default function VendorArchiveModal({ opened, onClose, vendorName, onArchive }: VendorArchiveModalProps) {
  const [input, setInput] = useState("");
  useEffect(() => { if (opened) setInput(""); }, [opened]);
  const disabled = vendorName.length > 0 && input !== vendorName;
  return (
    <Modal opened={opened} onClose={onClose} title="Archive vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
      <Stack>
        <Text c="dimmed">Archiving hides this vendor from the Database view. Type the vendor name to confirm.</Text>
        <Group align="end" gap="sm">
          <TextInput label="Vendor name" value={vendorName} readOnly style={{ flex: 1 }} />
          <CopyButton value={vendorName}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
        </Group>
        <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="orange" disabled={disabled} onClick={onArchive}>Archive</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

