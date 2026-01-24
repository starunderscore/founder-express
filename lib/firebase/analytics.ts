import { db } from './client';
import { collection, getDocs, query, where, orderBy, getCountFromServer } from 'firebase/firestore';

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Make Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function fetchUserSignupsByWeek(weeks: number, usersCollection = 'users') {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - weeks * 7);

    // Firestore query on createdAt >= start
    // Supports createdAt as Firestore Timestamp or millis number
    const col = collection(db(), usersCollection);
    const q = query(col, where('createdAt', '>=', start), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);

    const buckets = new Map<string, number>();
    for (const doc of snap.docs) {
      const data: any = doc.data();
      const ts: any = data.createdAt;
      let date: Date | null = null;
      if (ts && typeof ts.toDate === 'function') date = ts.toDate();
      else if (typeof ts === 'number') date = new Date(ts);
      else if (typeof ts === 'string') date = new Date(ts);
      if (!date) continue;
      const wk = startOfWeek(date);
      const label = `${wk.getMonth() + 1}/${wk.getDate()}`;
      buckets.set(label, (buckets.get(label) || 0) + 1);
    }

    // Build continuous series for N weeks
    const series: { week: string; signups: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const wk = startOfWeek(d);
      const label = `${wk.getMonth() + 1}/${wk.getDate()}`;
      series.push({ week: label, signups: buckets.get(label) || 0 });
    }
    return series;
  } catch (e) {
    console.error('fetchUserSignupsByWeek error', e);
    return null;
  }
}

export async function fetchUserCountsSummary(usersCollection = 'users') {
  try {
    const now = new Date();
    const d1 = new Date(now); d1.setDate(d1.getDate() - 1);
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);

    const col = collection(db(), usersCollection);

    const totalSnap = await getCountFromServer(col);

    const dauQ = query(col, where('lastActiveAt', '>=', d1));
    const wauQ = query(col, where('lastActiveAt', '>=', d7));
    const mauQ = query(col, where('lastActiveAt', '>=', d30));

    const [dauSnap, wauSnap, mauSnap] = await Promise.all([
      getCountFromServer(dauQ).catch(() => null),
      getCountFromServer(wauQ).catch(() => null),
      getCountFromServer(mauQ).catch(() => null),
    ]);

    return {
      total: totalSnap.data().count || 0,
      dau: dauSnap ? dauSnap.data().count || 0 : 0,
      wau: wauSnap ? wauSnap.data().count || 0 : 0,
      mau: mauSnap ? mauSnap.data().count || 0 : 0,
    };
  } catch (e) {
    console.error('fetchUserCountsSummary error', e);
    return null;
  }
}

export async function fetchTopCountries(limit = 5, usersCollection = 'users') {
  try {
    const col = collection(db(), usersCollection);
    const snap = await getDocs(col);
    const counts = new Map<string, number>();
    for (const doc of snap.docs) {
      const c = ((doc.data() as any).country || 'Unknown') as string;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const arr = Array.from(counts.entries()).map(([country, count]) => ({ country, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, limit);
  } catch (e) {
    console.error('fetchTopCountries error', e);
    return null;
  }
}

export async function fetchSignupsCountBetween(start: Date, end: Date, usersCollection = 'users') {
  try {
    const col = collection(db(), usersCollection);
    const q = query(col, where('createdAt', '>=', start), where('createdAt', '<', end));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    console.error('fetchSignupsCountBetween error', e);
    return null;
  }
}
