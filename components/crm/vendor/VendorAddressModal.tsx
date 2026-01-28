"use client";
import React, { useEffect, useState } from "react";
import { Modal, Tabs, TextInput, Group, Radio, Button } from "@mantine/core";

export type VendorAddress = {
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  isHQ?: boolean;
  phoneNumber?: string;
};

export type VendorAddressModalProps = {
  opened: boolean;
  onClose: () => void;
  onSave: (addr: VendorAddress) => Promise<void> | void;
};

export default function VendorAddressModal({ opened, onClose, onSave }: VendorAddressModalProps) {
  const [tab, setTab] = useState<string | null>("general");
  const [addr, setAddr] = useState<VendorAddress>({ line1: "" });
  useEffect(() => { if (opened) { setTab("general"); setAddr({ line1: "" }); } }, [opened]);
  const save = async () => { if (!addr.line1.trim()) return; await onSave({ ...addr, line1: addr.line1.trim() }); onClose(); };
  return (
    <Modal opened={opened} onClose={onClose} title="Edit vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="80%" padding={0} styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}>
      <div style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Tabs value={tab} onChange={setTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Tabs.List style={{ width: '100%' }}>
            <Tabs.Tab value="general">Address</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
            <TextInput label="Label" value={addr.label || ''} onChange={(e) => setAddr((p) => ({ ...p, label: e.currentTarget.value }))} />
            <TextInput mt="sm" label="Line 1" required value={addr.line1 || ''} onChange={(e) => setAddr((p) => ({ ...p, line1: e.currentTarget.value }))} />
            <TextInput mt="sm" label="Line 2" value={addr.line2 || ''} onChange={(e) => setAddr((p) => ({ ...p, line2: e.currentTarget.value }))} />
            <Group mt="sm" grow>
              <TextInput label="City" value={addr.city || ''} onChange={(e) => setAddr((p) => ({ ...p, city: e.currentTarget.value }))} />
              <TextInput label="Region/State" value={addr.region || ''} onChange={(e) => setAddr((p) => ({ ...p, region: e.currentTarget.value }))} />
            </Group>
            <Group mt="sm" grow>
              <TextInput label="Postal" value={addr.postal || ''} onChange={(e) => setAddr((p) => ({ ...p, postal: e.currentTarget.value }))} />
              <TextInput label="Country" value={addr.country || ''} onChange={(e) => setAddr((p) => ({ ...p, country: e.currentTarget.value }))} />
            </Group>
            <Group mt="sm">
              <Radio checked={!!addr.isHQ} onChange={(e) => setAddr((p) => ({ ...p, isHQ: e.currentTarget.checked }))} label="Headquarters" />
            </Group>
            <TextInput mt="sm" label="Phone (optional)" value={addr.phoneNumber || ''} onChange={(e) => setAddr((p) => ({ ...p, phoneNumber: e.currentTarget.value }))} placeholder="Attach a phone to this address" />
          </Tabs.Panel>
        </Tabs>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button onClick={save}>Save address</Button>
        </div>
      </div>
    </Modal>
  );
}

