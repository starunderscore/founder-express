"use client";
import React, { useEffect, useState } from "react";
import { Modal, Stack, Group, Button, TextInput, Select, Tabs, Title, MultiSelect } from "@mantine/core";
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot } from 'firebase/firestore';
import { DEFAULT_TAG_COLOR } from '@/services/tags/helpers';

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
  const [tagOptions, setTagOptions] = useState<{ value: string; label: string }[]>([]);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string | undefined>>({});
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

  // Compute readable text color for a hex background
  const contrastText = (hex?: string): string => {
    if (!hex || !hex.startsWith('#')) return '#fff';
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255; const g = (bigint >> 8) & 255; const b = bigint & 255;
    const srgb = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return L > 0.5 ? '#000' : '#fff';
  };

  // Load tag options from Tag Manager (Firestore)
  useEffect(() => {
    const unsub = onSnapshot(collection(db(), 'ep_tags'), (snap) => {
      const rows: { value: string; label: string; createdAt: number }[] = [];
      const cmap: Record<string, string | undefined> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        // Only include active tags
        const status = (data.status || 'active').toString();
        const removedAt = data.removedAt ?? null;
        const archiveAt = data.archiveAt ?? null;
        if (status !== 'active' || removedAt || archiveAt) return;
        const name = (data.name || '').toString();
        if (!name) return;
        rows.push({ value: name, label: name, createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0 });
        const color = (typeof data.color === 'string' && data.color.trim()) ? data.color.trim() : DEFAULT_TAG_COLOR;
        cmap[name] = color;
      });
      rows.sort((a, b) => (b.createdAt - a.createdAt) || a.label.localeCompare(b.label));
      setTagOptions(rows.map(({ value, label }) => ({ value, label })));
      setTagColorMap(cmap);
    });
    return () => unsub();
  }, []);

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
              <MultiSelect
                label="Tags"
                placeholder="Search and select tags"
                searchable
                data={tagOptions}
                value={tags}
                onChange={setTags}
                valueComponent={({ value, label, onRemove }: any) => {
                  const bg = tagColorMap[label] || DEFAULT_TAG_COLOR;
                  const fg = contrastText(bg);
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 6, background: bg, color: fg, fontSize: 12 }}>
                      {label}
                      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} style={{ background: 'transparent', border: 0, color: fg, cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </span>
                  );
                }}
                comboboxProps={{ withinPortal: true }}
              />
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
