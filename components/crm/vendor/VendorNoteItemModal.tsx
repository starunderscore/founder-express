"use client";
import React, { useEffect, useState } from "react";
import { Modal, Stack, Textarea, Group, Button } from "@mantine/core";

export type VendorNoteItemModalProps = {
  opened: boolean;
  onClose: () => void;
  onSave: (body: string) => Promise<void> | void;
};

export default function VendorNoteItemModal({ opened, onClose, onSave }: VendorNoteItemModalProps) {
  const [body, setBody] = useState("");
  useEffect(() => { if (opened) setBody(""); }, [opened]);
  const save = async () => { const b = body.trim(); if (!b) return; await onSave(b); onClose(); };
  return (
    <Modal opened={opened} onClose={onClose} title="Add note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
      <Stack>
        <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={8} value={body} onChange={(e) => setBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
        <Group justify="flex-end">
          <Button onClick={save}>Save note</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

