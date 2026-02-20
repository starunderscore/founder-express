"use client";
import { Modal } from '@mantine/core';
import EmailPreviewWindow from '@/components/EmailPreviewWindow';

export type EmailPreviewModalProps = {
  opened: boolean;
  onClose: () => void;
  subject: string;
  html: string;
  toName?: string;
  toEmail?: string;
  fromName?: string;
  fromEmail?: string;
  size?: string | number;
  withCloseButton?: boolean;
};

export default function EmailPreviewModal({
  opened,
  onClose,
  subject,
  html,
  toName,
  toEmail,
  fromName,
  fromEmail,
  size = 'xl',
  withCloseButton = true,
}: EmailPreviewModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Preview" size={size} centered withCloseButton={withCloseButton}>
      <EmailPreviewWindow subject={subject} html={html} toName={toName} toEmail={toEmail} fromName={fromName} fromEmail={fromEmail} />
    </Modal>
  );
}

