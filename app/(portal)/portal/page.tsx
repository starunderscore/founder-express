"use client";
import { AuthGate } from '@/components/AuthGate';
import { Button, Card, Group, SimpleGrid, Text, Title, Menu, ActionIcon } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLibraryStore } from '@/state/libraryStore';

type Library = { id: string; name: string; items: number };
const mockLibraries: Library[] = [
  { id: 'lib-1', name: 'Starter Patterns', items: 18 },
  { id: 'lib-2', name: 'Home Row Drills', items: 12 },
  { id: 'lib-3', name: 'Speed Bursts', items: 9 },
];

export default function DashboardPage() {
  const router = useRouter();
  const openLibrary = (id: string) => router.push(`/portal/editor?id=${encodeURIComponent(id)}`);
  const libraries = useLibraryStore((s) => s.libraries);
  const createLibrary = useLibraryStore((s) => s.createLibrary);
  const archiveLibrary = useLibraryStore((s) => s.archiveLibrary);
  const renameLibrary = useLibraryStore((s) => s.renameLibrary);
  return (
    <AuthGate>
      <div>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2}>Libraries</Title>
            <Text c="dimmed" size="sm">Create and manage your typing libraries</Text>
          </div>
          <Group>
            <Button variant="default" component={Link} href="/portal/editor">Open Editor</Button>
            <Button onClick={() => {
              const name = window.prompt('Library name');
              if (name && name.trim()) createLibrary(name.trim());
            }}>Create Library</Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {libraries.map((lib) => (
            <Card
              key={lib.id}
              withBorder
              shadow="sm"
              radius="md"
              padding="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => openLibrary(lib.id)}
            >
              <Group justify="space-between" mb="xs" align="flex-start">
                <div>
                  <Text fw={600}>{lib.name}</Text>
                  <Text c="dimmed" size="sm">{lib.items} items</Text>
                </div>
                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()} aria-label={`Options for ${lib.name}`}>
                      ⋯
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                    <Menu.Item onClick={() => openLibrary(lib.id)}>Open</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item onClick={() => { const name = window.prompt('Rename library', lib.name); if (name && name.trim()) renameLibrary(lib.id, name.trim()); }}>Rename</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="orange" onClick={() => archiveLibrary(lib.id)}>Archive</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              <Group justify="flex-start" mt="sm">
                <Button size="xs" variant="default" onClick={(e) => { e.stopPropagation(); openLibrary(lib.id); }}>
                  Open
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </div>
    </AuthGate>
  );
}
