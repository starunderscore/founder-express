import type { DocumentData } from 'firebase/firestore';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt: number;
};

export type NotificationCreateInput = {
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: number;
};

export type NotificationPatchInput = {
  title?: string;
  body?: string;
  link?: string;
  read?: boolean;
};

export type RawNotificationDoc = DocumentData & {
  title?: any;
  body?: any;
  link?: any;
  read?: any;
  createdAt?: any;
};

