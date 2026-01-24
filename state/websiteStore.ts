"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Newsbar = {
  enabled: boolean;
  headline: string;
  link: string;
};

type WebsiteState = {
  newsbar: Newsbar;
  updateNewsbar: (patch: Partial<Newsbar>) => void;
  blogs: BlogPost[];
  addBlog: (p: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBlog: (id: string, patch: Partial<BlogPost>) => void;
  removeBlog: (id: string) => void;
  reset: () => void;
};

const defaultNewsbar: Newsbar = {
  enabled: false,
  headline: '',
  link: '',
};

export const useWebsiteStore = create<WebsiteState>()(
  persist(
    (set) => ({
      newsbar: defaultNewsbar,
      blogs: [],
      updateNewsbar: (patch) => set((s) => ({ newsbar: { ...s.newsbar, ...patch } })),
      addBlog: (p) => set((s) => ({ blogs: [{ id: `blog-${Date.now()}`, ...p, createdAt: Date.now(), updatedAt: Date.now() }, ...s.blogs] })),
      updateBlog: (id, patch) => set((s) => ({ blogs: s.blogs.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)) })),
      removeBlog: (id) => set((s) => ({ blogs: s.blogs.filter((b) => b.id !== id) })),
      reset: () => set(() => ({ newsbar: defaultNewsbar, blogs: [] })),
    }),
    {
      name: 'pattern-typing-website',
      version: 3,
      migrate: (persisted: any, version) => {
        if (!persisted) return { newsbar: defaultNewsbar, blogs: [] } as any;
        if (!persisted.newsbar) persisted.newsbar = defaultNewsbar;
        if (typeof persisted.newsbar.enabled !== 'boolean') {
          persisted.newsbar.enabled = false;
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
};
