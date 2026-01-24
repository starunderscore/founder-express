"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Library = { id: string; name: string; items: number };

type LibraryState = {
  libraries: Library[];
  archived: Library[];
  createLibrary: (name: string) => void;
  renameLibrary: (id: string, name: string) => void;
  archiveLibrary: (id: string) => void;
  restoreLibrary: (id: string) => void;
  removeLibrary: (id: string) => void;
  getById: (id: string) => Library | undefined;
};

const seed: Library[] = [
  { id: 'lib-1', name: 'Starter Patterns', items: 18 },
  { id: 'lib-2', name: 'Home Row Drills', items: 12 },
  { id: 'lib-3', name: 'Speed Bursts', items: 9 },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      libraries: seed,
      archived: [],
      createLibrary: (name) =>
        set((s) => ({ libraries: [{ id: `lib-${Date.now()}`, name, items: 0 }, ...s.libraries] })),
      renameLibrary: (id, name) =>
        set((s) => ({
          libraries: s.libraries.map((l) => (l.id === id ? { ...l, name } : l)),
          archived: s.archived.map((l) => (l.id === id ? { ...l, name } : l)),
        })),
      archiveLibrary: (id) =>
        set((s) => {
          const lib = s.libraries.find((l) => l.id === id);
          if (!lib) return {} as any;
          return { libraries: s.libraries.filter((l) => l.id !== id), archived: [lib, ...s.archived] };
        }),
      restoreLibrary: (id) =>
        set((s) => {
          const lib = s.archived.find((l) => l.id === id);
          if (!lib) return {} as any;
          return { archived: s.archived.filter((l) => l.id !== id), libraries: [lib, ...s.libraries] };
        }),
      removeLibrary: (id) =>
        set((s) => ({ archived: s.archived.filter((l) => l.id !== id), libraries: s.libraries.filter((l) => l.id !== id) })),
      getById: (id) => {
        const s = get();
        return s.libraries.find((l) => l.id === id) || s.archived.find((l) => l.id === id);
      },
    }),
    { name: 'pattern-typing-libraries' }
  )
);

