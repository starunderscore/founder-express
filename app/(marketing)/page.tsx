import { Title, Text, Card, Group, Badge, SimpleGrid, AspectRatio } from '@mantine/core';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <>
      <section style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Videos</h2>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card withBorder padding="md" radius="md">
            <Group justify="space-between" mb={8}>
              <Title order={4}>Introduction</Title>
            </Group>
            <Text c="dimmed" size="sm" mb="sm">Must watch first</Text>
            <AspectRatio ratio={16 / 9}>
              <iframe
                src="https://www.youtube.com/embed/avPyeLm_nMI"
                title="Pattern Typing — Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 0, width: '100%', height: '100%', borderRadius: 8 }}
              />
            </AspectRatio>
          </Card>

          <Card withBorder padding="md" radius="md">
            <Group justify="space-between" mb={8}>
              <Title order={4}>Technical Stack</Title>
            </Group>
            <Text c="dimmed" size="sm" mb="sm">Skippable — for developers</Text>
            <AspectRatio ratio={16 / 9}>
              <iframe
                src="https://www.youtube.com/embed/cnQBRBJZiW0"
                title="Pattern Typing — Technical Stack"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 0, width: '100%', height: '100%', borderRadius: 8 }}
              />
            </AspectRatio>
          </Card>
        </SimpleGrid>
      </div>
      <div style={{ marginTop: 48 }}>
        <Group justify="space-between" mb={6}>
          <Title order={3}>Season 1 — The MVP</Title>
          <Badge color="gray" variant="light">Coming soon</Badge>
        </Group>
        <Text c="dimmed" size="sm">
          MVP stands for “minimal viable product” — the smallest, focused version of Pattern Typing
          we can ship to validate the experience, collect feedback, and iterate quickly.
        </Text>
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '6px 2px 10px 2px',
              scrollSnapType: 'x mandatory',
            }}
          >
            <Card
              withBorder
              padding="md"
              radius="md"
              style={{ flex: '0 0 360px', scrollSnapAlign: 'start' }}
            >
              <Group justify="space-between" mb={8}>
                <Title order={4} style={{ fontSize: 16 }}>01. The Foundation</Title>
                <Badge color="gray" variant="light">Coming soon</Badge>
              </Group>
              <AspectRatio ratio={16 / 9}>
                <div
                  style={{
                    background:
                      'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #f8fafc 10px, #f8fafc 20px)',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#64748b',
                    fontSize: 14,
                  }}
                >
                  Video placeholder
                </div>
              </AspectRatio>
            </Card>
          </div>
        </div>
      </div>

      </section>

      <section style={{ background: 'var(--mantine-color-indigo-9)', padding: '2.5rem 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 2rem' }}>
          <Group justify="space-between" mb={6}>
            <Title order={3} style={{ color: 'var(--mantine-color-white)' }}>Planned UI & System</Title>
            <Badge color="white" variant="light">Preview</Badge>
          </Group>
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>
            A glimpse of where Season 1 is headed: a clean practice dashboard with Libraries,
            and a technical direction that keeps the app fast, portable, and easy to extend.
            Feature blocks (``` typing) make Markdown chapters trainable.
          </Text>
          <div>
            <Title order={5} mb={6} style={{ color: 'var(--mantine-color-white)' }}>Planned practice dashboard and Libraries layout</Title>
            <Card withBorder padding="sm" radius="md" mb="md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Image
                src="/planned-gui/pattern-typing-ui.png"
                alt="Planned Pattern Typing UI"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
            </Card>

            <Title order={5} mb={6} style={{ color: 'var(--mantine-color-white)' }}>Technical architecture reference</Title>
            <Card withBorder padding="sm" radius="md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Image
                src="/planned-gui/tech-solution-future-voip-solutions-through-google-rehydration-example-1-out-of-a-ton.png"
                alt="High‑level technical architecture reference"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

const btnBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #0f172a10',
};
const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: '#0f172a',
  color: '#fff',
};
