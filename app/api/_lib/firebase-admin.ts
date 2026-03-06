import { getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;
  // Prefer ADC; projectId helps in some environments
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  adminApp = getApps().length ? getApps()[0] : initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}

