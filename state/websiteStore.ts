"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Newsbar = {
  enabled: boolean;
  // New HTML-based content for the public news bar
  primaryHtml: string;
  secondaryHtml: string;
  // Legacy fields kept for migration/back-compat only
  headline?: string;
  link?: string;
};

type WebsiteState = {
  newsbar: Newsbar;
  updateNewsbar: (patch: Partial<Newsbar>) => void;
  blogs: BlogPost[];
  addBlog: (p: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBlog: (id: string, patch: Partial<BlogPost>) => void;
  // Soft remove: mark as deleted; restore available in Removed tab
  removeBlog: (id: string) => void;
  // Restore a previously removed blog
  restoreBlog: (id: string) => void;
  // Permanently delete a blog (from Removed tab)
  hardDeleteBlog: (id: string) => void;
  // Archive/unarchive a blog (soft archive separate from remove)
  setBlogArchived: (id: string, archived: boolean) => void;
  reset: () => void;
};

const defaultNewsbar: Newsbar = {
  enabled: true,
  primaryHtml:
    '<strong>Star Underscore — fast, elegant apps.</strong> <a href="https://starunderscore.com" target="_blank" rel="noreferrer">Learn more →</a>',
  secondaryHtml:
    '<strong>MIT boilerplate</strong> &nbsp; <a href="https://github.com/starunderscore/founder-express" target="_blank" rel="noreferrer">Founder Express →</a>',
};

export const useWebsiteStore = create<WebsiteState>()(
  persist(
    (set) => ({
      newsbar: defaultNewsbar,
      blogs: [],
      updateNewsbar: (patch) => set((s) => ({ newsbar: { ...s.newsbar, ...patch } })),
      addBlog: (p) => set((s) => ({ blogs: [{ id: `blog-${Date.now()}`, ...p, createdAt: Date.now(), updatedAt: Date.now() }, ...s.blogs] })),
      updateBlog: (id, patch) => set((s) => ({ blogs: s.blogs.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)) })),
      removeBlog: (id) => set((s) => ({ blogs: s.blogs.map((b) => (b.id === id ? { ...b, deletedAt: Date.now(), updatedAt: Date.now() } : b)) })),
      restoreBlog: (id) => set((s) => ({ blogs: s.blogs.map((b) => (b.id === id ? { ...b, deletedAt: undefined, updatedAt: Date.now() } : b)) })),
      hardDeleteBlog: (id) => set((s) => ({ blogs: s.blogs.filter((b) => b.id !== id) })),
      setBlogArchived: (id, archived) => set((s) => ({ blogs: s.blogs.map((b) => (b.id === id ? { ...b, isArchived: archived, updatedAt: Date.now() } : b)) })),
      reset: () => set(() => ({ newsbar: defaultNewsbar, blogs: [] })),
    }),
    {
      name: 'pattern-typing-website',
      version: 5,
      migrate: (persisted: any, version) => {
        if (!persisted) return { newsbar: defaultNewsbar, blogs: [] } as any;
        if (!persisted.newsbar) persisted.newsbar = { ...defaultNewsbar };
        if (typeof persisted.newsbar.enabled !== 'boolean') {
          persisted.newsbar.enabled = false;
        }
        // v4: migrate legacy headline/link to primaryHtml if present
        if (typeof persisted.newsbar.primaryHtml !== 'string') {
          const legacyHeadline = (persisted.newsbar.headline || '').trim();
          const legacyLink = (persisted.newsbar.link || '').trim();
          if (legacyHeadline) {
            const linkPart = legacyLink
              ? ` <a href="${legacyLink}" target="_blank" rel="noreferrer">Learn more →</a>`
              : '';
            persisted.newsbar.primaryHtml = `${legacyHeadline}${linkPart}`;
          } else {
            persisted.newsbar.primaryHtml = defaultNewsbar.primaryHtml;
          }
        }
        if (typeof persisted.newsbar.secondaryHtml !== 'string') {
          persisted.newsbar.secondaryHtml = defaultNewsbar.secondaryHtml;
        }
        // v5: update old default secondary link "/" to GitHub repo if it matches the previous default text
        if (typeof persisted.newsbar.secondaryHtml === 'string') {
          const sec = persisted.newsbar.secondaryHtml;
          const hadOldLink = /<a\s+href=["']\/["'][^>]*>\s*Founder Express →\s*<\/a>/i.test(sec);
          const mentionsFE = /Founder Express →/i.test(sec) && /MIT boilerplate/i.test(sec);
          if (hadOldLink || mentionsFE) {
            persisted.newsbar.secondaryHtml = sec.replace(
              /href=["']\/["']/i,
              'href="https://github.com/starunderscore/founder-express"'
            );
          }
        }
        if (!Array.isArray(persisted.blogs)) persisted.blogs = [];
        return persisted as any;
      },
    }
  )
);

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  published: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  // Soft delete marker; present when in Removed tab
  deletedAt?: number;
  // Soft archive flag; present when in Archive tab
  isArchived?: boolean;
};
