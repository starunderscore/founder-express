import { db } from '@/lib/firebase/client';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  getDocs,
} from 'firebase/firestore';

export type BlogDoc = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  published: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  isArchived?: boolean | null;
};

const COL = 'blogs';

export function listenBlogsActive(cb: (docs: (BlogDoc & { id: string })[]) => void): Unsubscribe {
  const q = query(
    collection(db(), COL),
    where('deletedAt', '==', null),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
    cb(items);
  });
}

export function listenBlogsPublished(cb: (docs: (BlogDoc & { id: string })[]) => void): Unsubscribe {
  const q = query(
    collection(db(), COL),
    where('published', '==', true),
    where('deletedAt', '==', null),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
    cb(items);
  });
}

export function listenBlogsArchived(cb: (docs: (BlogDoc & { id: string })[]) => void): Unsubscribe {
  const q = query(collection(db(), COL), where('isArchived', '==', true), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
    cb(items);
  });
}

export function listenBlogsRemoved(cb: (docs: (BlogDoc & { id: string })[]) => void): Unsubscribe {
  const q = query(collection(db(), COL), where('deletedAt', '!=', null), orderBy('deletedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any;
    cb(items);
  });
}

export function listenBlogBySlug(slug: string, cb: (doc: (BlogDoc & { id: string }) | null) => void): Unsubscribe {
  const q = query(
    collection(db(), COL),
    where('slug', '==', slug),
    where('published', '==', true),
    where('deletedAt', '==', null),
    where('isArchived', '==', false)
  );
  return onSnapshot(q, (snap) => {
    const d = snap.docs[0];
    cb(d ? ({ id: d.id, ...(d.data() as any) } as any) : null);
  });
}

export async function createBlog(p: Omit<BlogDoc, 'createdAt' | 'updatedAt' | 'deletedAt' | 'isArchived'>) {
  const now = Date.now();
  await addDoc(collection(db(), COL), { ...p, createdAt: now, updatedAt: now, deletedAt: null, isArchived: false } as any);
}

export async function updateBlog(id: string, patch: Partial<BlogDoc>) {
  const ref = doc(db(), COL, id);
  await updateDoc(ref, { ...patch, updatedAt: Date.now() } as any);
}

export async function archiveBlog(id: string, flag: boolean) {
  await updateBlog(id, { isArchived: flag });
}

export async function softRemoveBlog(id: string) {
  await updateBlog(id, { deletedAt: Date.now() });
}

export async function restoreBlog(id: string) {
  await updateBlog(id, { deletedAt: null });
}

export async function hardDeleteBlog(id: string) {
  await deleteDoc(doc(db(), COL, id));
}
