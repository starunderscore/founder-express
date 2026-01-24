"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TagStatus = 'active' | 'archived' | 'removed';
export type TagDef = {
  id: string;
  name: string;
  color?: string; // hex or theme color name
  description?: string;
  status?: TagStatus; // defaults to 'active'
  createdAt: number;
};

type TagsState = {
  tags: TagDef[];
  addTag: (t: Omit<TagDef, 'id' | 'createdAt'>) => void;
  updateTag: (id: string, patch: Partial<TagDef>) => void;
  removeTag: (id: string) => void;
  renameTag: (id: string, name: string) => void;
  clearAll: () => void;
};

export const useTagsStore = create<TagsState>()(
  persist(
    (set) => ({
      tags: [],
      addTag: (t) => set((s) => ({ tags: [{ ...t, status: t.status ?? 'active', id: `tag-${Date.now()}`, createdAt: Date.now() }, ...s.tags] })),
      updateTag: (id, patch) => set((s) => ({ tags: s.tags.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeTag: (id) => set((s) => ({ tags: s.tags.filter((x) => x.id !== id) })),
      renameTag: (id, name) => set((s) => ({ tags: s.tags.map((x) => (x.id === id ? { ...x, name } : x)) })),
      clearAll: () => set(() => ({ tags: [] })),
    }),
    {
      name: 'pattern-typing-tags',
      version: 1,
    }
  )
);
