"use client";
import { Card, Group, Stack, Text, Badge, Divider } from "@mantine/core";

type Props = {
  subject: string;
  html: string;
  toName?: string;
  toEmail?: string;
  fromName?: string;
  fromEmail?: string;
};

export function EmailPreviewWindow({ subject, html, toName = "Recipient", toEmail = "recipient@example.com", fromName = "Sender", fromEmail = "no-reply@example.com" }: Props) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      {/* Window chrome */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'linear-gradient(var(--mantine-color-gray-1), var(--mantine-color-gray-0))', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" c="dimmed">Email Preview</Text>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#27c93f', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ffbd2e', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f56', display: 'inline-block' }} />
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <Stack gap={6}>
          <Group gap={10} wrap="wrap">
            <Text size="sm" c="dimmed" style={{ width: 70 }}>From</Text>
            <Text size="sm">{fromName} &lt;{fromEmail}&gt;</Text>
          </Group>
          <Group gap={10} wrap="wrap">
            <Text size="sm" c="dimmed" style={{ width: 70 }}>To</Text>
            <Text size="sm">{toName} &lt;{toEmail}&gt;</Text>
          </Group>
          <Group gap={10} wrap="wrap">
            <Text size="sm" c="dimmed" style={{ width: 70 }}>Subject</Text>
            <Text size="sm" fw={600}>{subject || '(No subject)'}</Text>
          </Group>
        </Stack>

        <Divider my={12} />

        <div style={{ padding: '4px 2px' }}>
          <div dangerouslySetInnerHTML={{ __html: html || '<em style="color: var(--mantine-color-dimmed)">No content</em>' }} />
        </div>
      </div>
    </Card>
  );
}

export default EmailPreviewWindow;
