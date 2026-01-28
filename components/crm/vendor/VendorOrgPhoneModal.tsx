"use client";
import React, { useEffect, useState } from "react";
import { Modal, Tabs, TextInput, Button } from "@mantine/core";

export type VendorOrgPhoneModalProps = {
  opened: boolean;
  onClose: () => void;
  onSave: (phone: { number: string; ext?: string; label?: string }) => Promise<void> | void;
};

export default function VendorOrgPhoneModal({ opened, onClose, onSave }: VendorOrgPhoneModalProps) {
  const [tab, setTab] = useState<string | null>("general");
  const [number, setNumber] = useState("");
  const [ext, setExt] = useState("");
  const [label, setLabel] = useState("");
  useEffect(() => { if (opened) { setTab("general"); setNumber(""); setExt(""); setLabel(""); } }, [opened]);
  const save = async () => { if (!number.trim()) return; await onSave({ number: number.trim(), ext: ext.trim() || undefined, label: label.trim() || undefined }); onClose(); };
  return (
    <Modal opened={opened} onClose={onClose} title="Edit vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="80%" padding={0} styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}>
      <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Tabs value={tab} onChange={setTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Tabs.List style={{ width: '100%' }}>
            <Tabs.Tab value="general">Phone</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
            <TextInput label="Number" value={number} onChange={(e) => setNumber(e.currentTarget.value)} required />
            <TextInput mt="sm" label="Ext" placeholder="Optional" value={ext} onChange={(e) => setExt(e.currentTarget.value)} />
            <TextInput mt="sm" label="Label" placeholder="e.g., Main, Support" value={label} onChange={(e) => setLabel(e.currentTarget.value)} />
          </Tabs.Panel>
        </Tabs>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button onClick={save}>Save phone</Button>
        </div>
      </div>
    </Modal>
  );
}

