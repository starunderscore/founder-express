import { Title, Text, Card, Group, Badge, Button, Stack } from '@mantine/core';
import Link from 'next/link';
import pkg from '../../package.json';

export default function LandingPage() {
  return (
    <main style={{ padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Branding hero */}
        <Card withBorder radius="md" padding="xl" className="hero-block">
          <Stack gap="xs" align="start">
            <Group gap={6}>
              <Badge variant="light" color="indigo">Founder Express</Badge>
              <Badge variant="light" color="gray">v{pkg.version}</Badge>
            </Group>
            <Title order={1} style={{ lineHeight: 1.05 }}>Boilerplate to build startups — fast</Title>
            <Text c="dimmed">Ship a usable stack day one: auth, roles, email, CRM, and an Employee Portal that actually helps.</Text>
            <Group gap="sm" mt="xs">
              <Button component={Link as any} href="/account/signup" color="indigo">Client sign up</Button>
              <Button component={Link as any} href="/employee/signin" variant="light">Employee sign in</Button>
            </Group>
          </Stack>
        </Card>

        {/* Employee Portal — datatables */}
        <section className="portal-section" style={{ marginTop: 24, padding: 16, borderRadius: 12, border: '1px solid var(--block-border)' }}>
          <Title order={3}>Employee portal</Title>
          <Text c="dimmed" mb="sm">Office operations, streamlined. Clear piles, quick moves.</Text>

        {/* Emails features */}
        <Title order={5} mb={6}>Emails features</Title>
        <div className="table-block" style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', width: 180 }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>What you get</th>
              </tr>
            </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>Newsletters</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Compose, preview, send — sent count at a glance.</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>Waiting List</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Collect emails, save drafts, send campaigns; live counters.</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>3rd‑Party Providers</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Plug SendGrid / Resend. Simple status table, no guessing.</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>Email Templates</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Reusable content + variables; auth names protected.</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>Email Variables</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Central tokens like COMPANY_NAME for consistent branding.</Text></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>System Emails</td>
                    <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Password reset & verification — yours to edit.</Text></td>
                  </tr>
                </tbody>
              </table>
            </div>

        {/* Management features */}
        <Title order={5} mb={6}>Management</Title>
        <div className="table-block" style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', width: 180 }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>What you get</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>Customers</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">CRM basics: orgs, contacts, notes, and tidy archive/restore.</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>Employees</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Add, edit, archive, remove. Keep people and access in sync.</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>Roles & Permissions</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Bundle access into roles; tick permissions per feature.</Text></td>
              </tr>
            </tbody>
          </table>
        </div>

        </section>

        {/* Developer stack */}
        <Title order={3} mt="xl">Developer stack</Title>
        <Text c="dimmed" mb="sm">Powered by Firebase for auth and data, with a modern Next.js UI layer.</Text>

        <Group gap={6} mt={4} mb={8}>
          <Badge variant="light">Next.js</Badge>
          <Badge variant="light">React</Badge>
          <Badge variant="light">Firebase</Badge>
          <Badge variant="light">Mantine</Badge>
          <Badge variant="light">Zustand</Badge>
          <Badge variant="light">Tiptap</Badge>
          <Badge variant="light">Recharts</Badge>
          <Badge variant="light">Framer Motion</Badge>
          <Badge variant="light">Stripe</Badge>
          <Badge variant="light">Zod</Badge>
          <Badge variant="light">CodeMirror</Badge>
        </Group>

        <Title order={5} mb={2}>Architecture details</Title>
        <Text c="dimmed" size="sm" mb={6}>What powers each layer</Text>
        <div className="table-block" style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', width: 200 }}>Area</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Tools</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px' }}>Backend</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Firebase Auth, Firestore (client SDK)</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Web app</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Next.js 14, React 18, Mantine UI</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>State & data</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Zustand (light UI toggles), Zod</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Editor</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Tiptap, CodeMirror</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Charts</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Recharts</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Motion</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Framer Motion</Text></td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Payments</td>
                <td style={{ padding: '8px' }}><Text c="dimmed" size="sm">Stripe</Text></td>
              </tr>
            </tbody>
          </table>
        </div>

        
        {/* dark mode styles */}
        <style>
          {`
          .hero-block{background:linear-gradient(135deg, var(--mantine-color-gray-0) 0%, #ffffff 60%);} 
          @media (prefers-color-scheme: dark){
            .hero-block{background:linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 60%);} 
          }
          .portal-section{--block-border: var(--mantine-color-gray-3); background: var(--mantine-color-gray-0);} 
          @media (prefers-color-scheme: dark){
            .portal-section{--block-border: var(--mantine-color-dark-4); background: var(--mantine-color-dark-7);} 
          }
          .table-block{--block-border: var(--mantine-color-gray-3); background: var(--mantine-color-gray-0); border:1px solid var(--block-border); border-radius:8px; padding:8px;}
          .table-block th{border-bottom:1px solid var(--block-border);} 
          @media (prefers-color-scheme: dark){
            .table-block{--block-border: var(--mantine-color-dark-4); background: var(--mantine-color-dark-6);} 
          }
          `}
        </style>
      </div>
    </main>
  );
}
