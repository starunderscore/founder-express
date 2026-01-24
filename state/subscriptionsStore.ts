"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionEntry = {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
  source?: 'manual' | 'import' | 'api';
};

export type DraftWaitlistEmail = {
  id: string;
  subject: string;
  body: string;
  updatedAt: number;
};

export type Waitlist = {
  id: string;
  name: string;
  createdAt: number;
  entries: SubscriptionEntry[];
  sent?: SentWaitlistEmail[];
  drafts?: DraftWaitlistEmail[];
  deletedAt?: number;
};

export type NewsletterCampaign = {
  id: string;
  subject: string;
  previewText?: string;
  sentAt?: number; // undefined if draft/scheduled
  status: 'Draft' | 'Scheduled' | 'Sent';
  recipients: number;
  body?: string;
  contextWaitlistId?: string; // reference only, no coupling
};

export type SentWaitlistEmail = {
  id: string;
  subject: string;
  body: string;
  sentAt: number;
  recipients: number;
};

type SubscriptionsState = {
  waitlists: Waitlist[];
  emailList: SubscriptionEntry[];
  newsletters: NewsletterCampaign[];
  addWaitlist: (name: string) => { ok: boolean; id?: string; reason?: string };
  removeWaitlist: (waitlistId: string) => void; // soft-remove
  restoreWaitlist: (waitlistId: string) => void;
  hardDeleteWaitlist: (waitlistId: string) => void;
  addToWaitlist: (waitlistId: string, email: string, name?: string, source?: SubscriptionEntry['source']) => { ok: boolean; reason?: string };
  addToEmailList: (email: string, name?: string, source?: SubscriptionEntry['source']) => { ok: boolean; reason?: string };
  removeWaitingEntry: (waitlistId: string, id: string) => void;
  removeEmail: (id: string) => void;
  sendEmailToWaitlist: (waitlistId: string, subject: string, body: string) => { ok: boolean; reason?: string };
  saveDraftToWaitlist: (waitlistId: string, subject: string, body: string) => { ok: boolean; reason?: string };
  addNewsletterCampaign: (c: Omit<NewsletterCampaign, 'id'>) => void;
  removeNewsletterCampaign: (id: string) => void;
  clearAll: () => void;
};

const normalizeEmail = (e: string) => e.trim().toLowerCase();

export const useSubscriptionsStore = create<SubscriptionsState>()(
  persist(
    (set, get) => ({
      waitlists: [
        {
          id: 'waitlist-100',
          name: 'Default',
          createdAt: Date.now() - 86400000 * 3,
          entries: [
            { id: 'wait-1001', email: 'alex@example.com', name: 'Alex', createdAt: Date.now() - 86400000 * 2, source: 'manual' },
            { id: 'wait-1002', email: 'morgan@example.com', name: 'Morgan', createdAt: Date.now() - 86400000, source: 'api' },
          ],
          sent: [],
          drafts: [],
        },
      ],
      emailList: [
        { id: 'list-2001', email: 'pat@example.com', name: 'Pat', createdAt: Date.now() - 86400000 * 7, source: 'import' },
        { id: 'list-2002', email: 'sam@example.com', name: 'Sam', createdAt: Date.now() - 86400000 * 5, source: 'manual' },
        { id: 'list-2003', email: 'jamie@example.com', name: 'Jamie', createdAt: Date.now() - 86400000 * 3, source: 'manual' },
      ],
      newsletters: [
        { id: 'nl-3001', subject: 'April Product Update', previewText: 'New features and improvements', sentAt: Date.now() - 86400000 * 10, status: 'Sent', recipients: 342 },
        { id: 'nl-3002', subject: 'Summer Sale Announcement', previewText: 'Save up to 30%', status: 'Draft', recipients: 0 },
      ],
      addWaitlist: (name: string) => {
        const nm = (name || '').trim();
        if (!nm) return { ok: false, reason: 'Waiting list name required' };
        const exists = get().waitlists.some((b) => b.name.toLowerCase() === nm.toLowerCase());
        if (exists) return { ok: false, reason: 'Waiting list already exists' };
        const id = `waitlist-${Date.now()}`;
        set((s) => ({ waitlists: [{ id, name: nm, createdAt: Date.now(), entries: [] }, ...s.waitlists] }));
        return { ok: true, id };
      },
      removeWaitlist: (waitlistId: string) => set((s) => ({ waitlists: s.waitlists.map((b) => (b.id === waitlistId ? { ...b, deletedAt: Date.now() } : b)) })),
      restoreWaitlist: (waitlistId: string) => set((s) => ({ waitlists: s.waitlists.map((b) => (b.id === waitlistId ? { ...b, deletedAt: undefined } : b)) })),
      hardDeleteWaitlist: (waitlistId: string) => set((s) => ({ waitlists: s.waitlists.filter((b) => b.id !== waitlistId) })),
      addToWaitlist: (waitlistId, email, name, source = 'manual') => {
        const e = normalizeEmail(email);
        if (!e || !e.includes('@')) return { ok: false, reason: 'Invalid email' };
        const lists = get().waitlists;
        const idx = lists.findIndex((b) => b.id === waitlistId);
        if (idx === -1) return { ok: false, reason: 'Waiting list not found' };
        const list = lists[idx];
        const exists = list.entries.some((x) => x.email === e);
        if (exists) return { ok: false, reason: 'Already in waiting list' };
        const updated: Waitlist = { ...list, entries: [{ id: `wait-${Date.now()}`, email: e, name: name?.trim() || undefined, createdAt: Date.now(), source }, ...list.entries] };
        set((s) => ({ waitlists: s.waitlists.map((b) => (b.id === waitlistId ? updated : b)) }));
        return { ok: true };
      },
      addToEmailList: (email, name, source = 'manual') => {
        const e = normalizeEmail(email);
        if (!e || !e.includes('@')) return { ok: false, reason: 'Invalid email' };
        const exists = get().emailList.some((x) => x.email === e);
        if (exists) return { ok: false, reason: 'Already subscribed' };
        set((s) => ({ emailList: [{ id: `list-${Date.now()}`, email: e, name: name?.trim() || undefined, createdAt: Date.now(), source }, ...s.emailList] }));
        return { ok: true };
      },
      removeWaitingEntry: (waitlistId, id) =>
        set((s) => ({
          waitlists: s.waitlists.map((b) => (b.id === waitlistId ? { ...b, entries: b.entries.filter((x) => x.id !== id) } : b)),
        })),
      removeEmail: (id) => set((s) => ({ emailList: s.emailList.filter((x) => x.id !== id) })),
      addNewsletterCampaign: (c) => set((s) => ({ newsletters: [{ id: `nl-${Date.now()}`, ...c }, ...s.newsletters] })),
      removeNewsletterCampaign: (id) => set((s) => ({ newsletters: s.newsletters.filter((x) => x.id !== id) })),
      sendEmailToWaitlist: (waitlistId, subject, body) => {
        const lists = get().waitlists;
        const idx = lists.findIndex((b) => b.id === waitlistId);
        if (idx === -1) return { ok: false, reason: 'Waiting list not found' };
        const list = lists[idx];
        const recipients = list.entries.length;
        if (!subject.trim()) return { ok: false, reason: 'Subject required' };
        if (!body.trim()) return { ok: false, reason: 'Message required' };
        const email: SentWaitlistEmail = { id: `sent-${Date.now()}`, subject: subject.trim(), body, sentAt: Date.now(), recipients };
        const updated: Waitlist = { ...list, sent: [email, ...(list.sent || [])] };
        set((s) => ({ waitlists: s.waitlists.map((b) => (b.id === waitlistId ? updated : b)) }));
        return { ok: true };
      },
      saveDraftToWaitlist: (waitlistId, subject, body) => {
        const lists = get().waitlists;
        const idx = lists.findIndex((b) => b.id === waitlistId);
        if (idx === -1) return { ok: false, reason: 'Waiting list not found' };
        const list = lists[idx];
        const draft: DraftWaitlistEmail = { id: `draft-${Date.now()}`, subject: subject.trim(), body, updatedAt: Date.now() };
        const updated: Waitlist = { ...list, drafts: [draft, ...(list.drafts || [])] };
        set((s) => ({ waitlists: s.waitlists.map((b) => (b.id === waitlistId ? updated : b)) }));
        return { ok: true };
      },
      clearAll: () => set(() => ({ waitlists: [], emailList: [], newsletters: [] })),
    }),
    {
      name: 'pattern-typing-subscriptions',
      version: 6,
      migrate: (persisted: any, version) => {
        if (!persisted) return undefined as any; // fall back to defaults above
        // v1 -> v2 migration (legacy)
        if (Array.isArray(persisted.newsletter) && !persisted.emailList) {
          persisted.emailList = persisted.newsletter;
          delete persisted.newsletter;
        }
        if (version < 3) {
          // Convert waitingList (array of emails) into a single Default bucket
          const legacyWaiting: SubscriptionEntry[] = persisted.waitingList || [];
          const createdAt = Date.now();
          persisted.waitingBuckets = [
            { id: 'bucket-legacy', name: 'Default', createdAt, entries: Array.isArray(legacyWaiting) ? legacyWaiting : [] },
          ];
          delete persisted.waitingList;
        }
        if (version < 4) {
          // Rename waitingBuckets -> waitlists (ids unchanged)
          const wb = Array.isArray(persisted.waitingBuckets) ? persisted.waitingBuckets : [];
          persisted.waitlists = wb.map((b: any) => ({
            id: String(b.id || `waitlist-${Date.now()}`),
            name: String(b.name || 'Untitled'),
            createdAt: Number(b.createdAt || Date.now()),
            entries: Array.isArray(b.entries) ? b.entries : [],
          }));
          delete persisted.waitingBuckets;
        }
        if (!persisted.waitlists) persisted.waitlists = [];
        // Ensure sent/drafts arrays exist on waitlists
        persisted.waitlists = (persisted.waitlists as any[]).map((w: any) => ({
          ...w,
          sent: Array.isArray(w.sent) ? w.sent : [],
          drafts: Array.isArray(w.drafts) ? w.drafts : [],
          deletedAt: typeof w.deletedAt === 'number' ? w.deletedAt : undefined,
        }));
        // Ensure newsletters include new optional fields
        if (!persisted.newsletters) persisted.newsletters = [];
        persisted.newsletters = (persisted.newsletters as any[]).map((n: any) => ({
          id: n.id,
          subject: n.subject,
          previewText: n.previewText,
          sentAt: n.sentAt,
          status: n.status || 'Draft',
          recipients: typeof n.recipients === 'number' ? n.recipients : 0,
          body: n.body || '',
          contextWaitlistId: n.contextWaitlistId || undefined,
        }));
        if (!persisted.emailList) persisted.emailList = [];
        return persisted as any;
      },
    }
  )
);
