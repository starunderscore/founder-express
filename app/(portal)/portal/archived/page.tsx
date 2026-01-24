"use client";
import { AuthGate } from '@/components/AuthGate';
import { Button, Card, Group, Menu, ActionIcon, SimpleGrid, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useLibraryStore } from '@/state/libraryStore';

export default function ArchivedLibrariesPage() {
  const router = useRouter();
  const openLibrary = (id: string) => router.push(`/portal/editor?id=${encodeURIComponent(id)}`);
  const archived = useLibraryStore((s) => s.archived);
  const restoreLibrary = useLibraryStore((s) => s.restoreLibrary);
  const renameLibrary = useLibraryStore((s) => s.renameLibrary);
  const removeLibrary = useLibraryStore((s) => s.removeLibrary);

  return (
    <AuthGate>
      <div>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2}>Archived Libraries</Title>
            <Text c="dimmed" size="sm">Libraries you’ve archived are listed here</Text>
          </div>
        </Group>

        {archived.length === 0 ? (
          <Card withBorder p="lg">No archived libraries yet.</Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {archived.map((lib) => (
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
                      <Menu.Item color="green" onClick={() => restoreLibrary(lib.id)}>Restore</Menu.Item>
                      <Menu.Item color="red" onClick={() => removeLibrary(lib.id)}>Delete</Menu.Item>
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
        )}
      </div>
    </AuthGate>
  );
}
