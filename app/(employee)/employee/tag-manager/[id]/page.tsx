"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useToast } from '@/components/ToastProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Group, TextInput, Textarea, Button, ColorInput, Badge, ActionIcon, Modal, Stack, Alert, Popover, ColorPicker } from '@mantine/core';
import { IconPalette } from '@tabler/icons-react';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { DEFAULT_TAG_COLOR } from '@/services/tags/helpers';
import type { Route } from 'next';

type TagStatus = 'active' | 'archived' | 'removed';
type TagDef = { id: string; name: string; color?: string; description?: string; status?: TagStatus; createdAt: number; isArchived?: boolean; deletedAt?: number };

const contrastText = (hex?: string): string => {
  if (!hex || !hex.startsWith('#')) return '#fff';
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.5 ? '#000' : '#fff';
};

export default function TagDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [tag, setTag] = useState<TagDef | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const ref = doc(db(), 'ep_tags', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setTag(null); return; }
      const data = snap.data() as any;
      const t: TagDef = {
        id: snap.id,
        name: data.name || '',
        color: data.color || undefined,
        description: data.description || undefined,
        status: (data.status as TagStatus) || 'active',
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        isArchived: !!data.isArchived,
        deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined,
      };
      setTag(t);
      setName(t.name);
      setColor(t.color || DEFAULT_TAG_COLOR);
      setDescription(t.description || '');
    });
    return () => unsub();
  }, [params.id]);

  // Removed usage panel in the free version

  if (!tag) {
    return (
      <EmployerAuthGate>
        <Group>
          <Button variant="light" component={Link} href="/employee/tag-manager">Back</Button>
          <Text>Tag not found</Text>
        </Group>
      </EmployerAuthGate>
    );
  }

  const returnHref = (): Route => {
    if (tag?.status === 'removed' || tag?.deletedAt) return '/employee/tag-manager/removed' as Route;
    if (tag?.status === 'archived' || tag?.isArchived) return '/employee/tag-manager/archive' as Route;
    return '/employee/tag-manager' as Route;
  };

  const save = async () => {
    await updateDoc(doc(db(), 'ep_tags', tag.id), { name: name.trim(), color: color?.trim() || undefined, description: description.trim() || undefined } as any);
    toast.show({ title: 'Tag saved', message: name.trim() || tag.name, color: 'green' });
    router.push(returnHref());
  };

  return (
    <EmployerAuthGate>
      <Group justify="space-between" align="center" mb="md">
        <Group gap={8}>
          <ActionIcon
            variant="subtle"
            size="lg"
            aria-label="Back"
            onClick={() => router.push(returnHref())}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={2}>Edit tag</Title>
            <Text c="dimmed">Rename and update appearance.</Text>
          </div>
        </Group>
        <Group gap="xs" ml="auto">
          <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
          <Button onClick={save} disabled={!name.trim()}>Save</Button>
        </Group>
      </Group>

      {tag?.status === 'removed' && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          This tag is removed and appears in the Removed tab.
        </Alert>
      )}
      {tag && tag.status === 'archived' && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          This tag is archived and hidden from the Active list.
        </Alert>
      )}

      <Card withBorder mb="md">
        <Group align="end" grow>
          <TextInput
            label="Name"
            withAsterisk
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            maxLength={40}
            rightSection={<Text size="xs" c="dimmed">{(name || '').length}/40</Text>}
            rightSectionWidth={56}
          />
          <ColorInput
            label="Color"
            value={color}
            onChange={setColor as any}
            format="hex"
            disallowInput={false}
            withPicker
            withEyeDropper
            rightSectionWidth={36}
            rightSection={
              <Popover position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                  <ActionIcon variant="subtle" aria-label="Open color picker">
                    <IconPalette size={16} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <ColorPicker format="hex" value={color || '#228be6'} onChange={setColor as any} withPicker size="md" />
                </Popover.Dropdown>
              </Popover>
            }
          />
        </Group>
        <Textarea
          label="Description"
          placeholder="What this tag means and how to use it"
          minRows={3}
          mt="sm"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          maxLength={280}
          rightSection={<Text size="xs" c="dimmed">{(description || '').length}/280</Text>}
          rightSectionWidth={64}
        />
      </Card>

      <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" size="sm" centered>
        <Stack>
          <Group justify="flex-start" mt="xs" mb="xs">
            <span style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 10, background: (color || DEFAULT_TAG_COLOR), color: contrastText(color || DEFAULT_TAG_COLOR), fontWeight: 600 }}>
              {name.trim() || 'Tag'}
            </span>
          </Group>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
          </Group>
        </Stack>
      </Modal>

    </EmployerAuthGate>
  );
}
