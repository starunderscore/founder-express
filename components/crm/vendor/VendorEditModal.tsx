"use client";
import React, { useEffect, useState } from "react";
import { Modal, Stack, Group, Button, TextInput, Select, TagsInput, Tabs, Title } from "@mantine/core";

type Employee = { id: string; name: string };

export type VendorEditModalProps = {
  opened: boolean;
  onClose: () => void;
  vendor: any | null;
  employees: Employee[];
  onSave: (patch: {
    name: string;
    source: string;
    sourceDetail?: string;
    tags: string[];
    ownerId?: string | null;
  }) => Promise<void> | void;
};

export default function VendorEditModal({ opened, onClose, vendor, employees, onSave }: VendorEditModalProps) {
  const [tab, setTab] = useState<string | null>("overview");
  const [name, setName] = useState("");
  const [source, setSource] = useState<string>("no-source");
  const [sourceDetail, setSourceDetail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (opened && vendor) {
      setTab("overview");
      setName(vendor.name || "");
      setSource(vendor.source || "no-source");
      setSourceDetail(vendor.source === "Other" ? vendor.sourceDetail || "" : "");
      setTags(Array.isArray(vendor.tags) ? vendor.tags : []);
      setOwnerId(typeof vendor.ownerId === "string" ? vendor.ownerId : null);
    }
  }, [opened, vendor]);

  const save = async () => {
    await onSave({
      name: name.trim(),
      source,
      sourceDetail: source === "Other" ? (sourceDetail.trim() || undefined) : undefined,
      tags,
      ownerId,
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="80%" padding={0} styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}>
      <div style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Tabs value={tab} onChange={setTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Tabs.List style={{ width: '100%' }}>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
            <Group mt="sm" align="end" grow>
              <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
            </Group>
            <Group mt="sm" align="end" grow>
              <Select label="Source" data={[ 'no-source','Website','Referral','Paid Ads','Social','Event','Import','Waiting List','Other' ]} value={source} onChange={(v) => setSource((v as string) || 'no-source')} allowDeselect={false} />
            </Group>
            {source === 'Other' && (
              <TextInput mt="sm" label="Other source" value={sourceDetail} onChange={(e) => setSourceDetail(e.currentTarget.value)} />
            )}
            <Group mt="sm" align="end" grow>
              <TagsInput label="Tags" placeholder="Add tags" value={tags} onChange={setTags} />
            </Group>
            <Group mt="sm" grow>
              <Select
                label="Account owner"
                placeholder="Assign owner"
                data={employees.map((e) => ({ value: e.id, label: e.name }))}
                value={ownerId}
                onChange={(v) => setOwnerId((v as string) || null)}
                allowDeselect
                searchable
                nothingFoundMessage="No employees"
              />
            </Group>
          </Tabs.Panel>
        </Tabs>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button onClick={save}>Save changes</Button>
        </div>
      </div>
    </Modal>
  );
}

