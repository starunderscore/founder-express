import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildProductCreate, buildProductPatchObject, filterProductsByStatus, normalizeProduct, type ProductStatus } from './helpers';
import type { Product, ProductCreateInput, ProductPatchInput, Price } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_finance_products';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listProducts(status: ProductStatus = 'active', opts?: Options): Promise<Product[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  // Fetch all and filter client-side to avoid heavy index setup; acceptable for small admin datasets
  const snap = await getDocs(query(colRef(store)));
  const rows = snap.docs.map((d) => normalizeProduct(d.id, d.data()));
  return filterProductsByStatus(rows, status);
}

export function listenProducts(status: ProductStatus, cb: (rows: Product[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizeProduct(d.id, d.data()));
    cb(filterProductsByStatus(rows, status));
  });
}

export async function createProduct(input: ProductCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildProductCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateProductDoc(id: string, patch: ProductPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildProductPatchObject(patch);
  if (Object.keys(obj).length === 0) return;
  await updateDoc(doc(store, COL_PATH, id), obj as any);
}

export async function addPriceToProduct(id: string, price: Omit<Price, 'id'>, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(doc(store, COL_PATH, id));
  const base = snap.data() || {};
  const list = Array.isArray((base as any).prices) ? (base as any).prices : [];
  const next = [...list, { ...price, id: `price-${Date.now()}-${Math.random().toString(36).slice(2,7)}` }];
  await updateDoc(doc(store, COL_PATH, id), { prices: next, updatedAt: Date.now() } as any);
}

export async function updatePriceOnProduct(id: string, priceId: string, patch: Partial<Omit<Price, 'id'>>, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(doc(store, COL_PATH, id));
  const base = snap.data() || {};
  const list: any[] = Array.isArray((base as any).prices) ? (base as any).prices : [];
  const next = list.map((p) => (p.id === priceId ? { ...p, ...patch } : p));
  await updateDoc(doc(store, COL_PATH, id), { prices: next, updatedAt: Date.now() } as any);
}

export async function removePriceFromProduct(id: string, priceId: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(doc(store, COL_PATH, id));
  const base = snap.data() || {};
  const list: any[] = Array.isArray((base as any).prices) ? (base as any).prices : [];
  const next = list.filter((p) => p.id !== priceId);
  await updateDoc(doc(store, COL_PATH, id), { prices: next, updatedAt: Date.now() } as any);
}

export async function archiveProductDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: Date.now(), removedAt: null, updatedAt: Date.now() } as any);
}

export async function restoreProductDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: null, removedAt: null, updatedAt: Date.now() } as any);
}

export async function removeProductDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { removedAt: Date.now(), updatedAt: Date.now() } as any);
}

