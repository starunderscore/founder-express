import { db } from './client';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

const SESSIONS = process.env.NEXT_PUBLIC_FIREBASE_SESSIONS_COLLECTION || 'sessions';

export type SessionPayload = {
  id: string;
  state: DocumentData;
  updatedAt: any;
};

export function sessionDoc(sessionId: string) {
  return doc(db(), SESSIONS, sessionId);
}

export async function createOrMergeSession(sessionId: string, state: DocumentData) {
  await setDoc(
    sessionDoc(sessionId),
    { id: sessionId, state, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function pushSessionState(sessionId: string, state: DocumentData) {
  await updateDoc(sessionDoc(sessionId), {
    state,
    updatedAt: serverTimestamp(),
  });
}

export function listenSession(sessionId: string, cb: (payload: SessionPayload | null) => void): Unsubscribe {
  return onSnapshot(sessionDoc(sessionId), (snap) => {
    if (!snap.exists()) return cb(null);
    const data = snap.data();
    cb(data as SessionPayload);
  });
}

