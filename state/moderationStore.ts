"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModerationStatus = 'Open' | 'Resolved' | 'Dismissed';
export type Severity = 'Low' | 'Medium' | 'High';
export type PostType = 'News' | 'Comment' | 'Page' | 'Other';

export type Report = {
  id: string;
  postId: string;
  postTitle: string;
  postType: PostType;
  reason: string;
  severity: Severity;
  status: ModerationStatus;
  reporter?: string;
  reportedAt: number;
  content?: string; // sample content to review (demo only)
};

type ModerationState = {
  reports: Report[];
  addReport: (r: Omit<Report, 'id' | 'reportedAt' | 'status'> & { status?: ModerationStatus }) => string;
  updateReport: (id: string, patch: Partial<Report>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Report>) => void;
  clearAll: () => void;
};

const seedReports: Report[] = [
  {
    id: 'rep-1001',
    postId: 'news-2024-12',
    postTitle: 'Quarterly Update',
    postType: 'News',
    reason: 'Spam links in content',
    severity: 'Medium',
    status: 'Open',
    reporter: 'user42@example.com',
    reportedAt: Date.now() - 1000 * 60 * 60 * 6,
    content:
      `## Quarterly Update\n\nThanks for reading our quarterly update!\n\nVisit our partner at [spammy.example.com](https://spammy.example.com) for exclusive deals!!!`,
  },
  {
    id: 'rep-1002',
    postId: 'cmt-9981',
    postTitle: 'Comment on "Quarterly Update"',
    postType: 'Comment',
    reason: 'Harassment',
    severity: 'High',
    status: 'Open',
    reporter: 'user77@example.com',
    reportedAt: Date.now() - 1000 * 60 * 50,
    content:
      `This comment is unacceptable and targets another user.\n\n> You are so dumb...`,
  },
  {
    id: 'rep-1003',
    postId: 'page-about',
    postTitle: 'About Us',
    postType: 'Page',
    reason: 'Outdated information',
    severity: 'Low',
    status: 'Resolved',
    reporter: 'user3@example.com',
    reportedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    content:
      `Legacy copy: We operate in only 2 cities.\n\nNote: This is outdated — we now operate nationwide.`,
  },
];

export const useModerationStore = create<ModerationState>()(
  persist(
    (set) => ({
      reports: seedReports,
      addReport: (r) => {
        let newId = '';
        set((s) => {
          newId = `rep-${Date.now()}`;
          const status = r.status ?? 'Open';
          const nr: Report = { ...r, id: newId, status, reportedAt: Date.now() } as Report;
          return { reports: [nr, ...s.reports] };
        });
        return newId;
      },
      updateReport: (id, patch) => set((s) => ({ reports: s.reports.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      bulkUpdate: (ids, patch) => set((s) => ({ reports: s.reports.map((x) => (ids.includes(x.id) ? { ...x, ...patch } : x)) })),
      clearAll: () => set(() => ({ reports: [] })),
    }),
    { name: 'pattern-typing-moderation', version: 1 }
  )
);
