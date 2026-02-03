import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';

export type NewsbarDoc = {
  enabled: boolean;
  primaryHtml: string;
  secondaryHtml: string;
  updatedAt: number;
  updatedBy?: string;
};

const DOC_PATH = ['website', 'newsbar'] as const;

function newsbarRef() {
  return doc(db(), DOC_PATH[0], DOC_PATH[1]);
}

export function listenNewsbar(cb: (doc: NewsbarDoc | null) => void): Unsubscribe {
  return onSnapshot(newsbarRef(), (snap) => {
    if (!snap.exists()) return cb(null);
    const data = snap.data() as any;
    cb({
      enabled: !!data.enabled,
      primaryHtml: String(data.primaryHtml || ''),
      secondaryHtml: String(data.secondaryHtml || ''),
      updatedAt: Number(data.updatedAt || 0),
      updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
    });
  });
}

export async function saveNewsbar(docData: Pick<NewsbarDoc, 'enabled' | 'primaryHtml' | 'secondaryHtml'> & { updatedBy?: string }) {
  const payload: NewsbarDoc = {
    enabled: !!docData.enabled,
    primaryHtml: (docData.primaryHtml || '').trim(),
    secondaryHtml: (docData.secondaryHtml || '').trim(),
    updatedAt: Date.now(),
    updatedBy: docData.updatedBy,
  };
  await setDoc(newsbarRef(), payload, { merge: true });
}

