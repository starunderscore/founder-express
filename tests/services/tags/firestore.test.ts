import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { getDoc, doc } from 'firebase/firestore';
import { setupRulesTestEnv } from '../../utils/emulator';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { archiveTag, createTag, deleteTag, listTags, removeTag, restoreTag, updateTag } from '../../../services/tags/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await setupRulesTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('services/tags firestore (business logic)', () => {
  it('create and list tags', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      const id = await createTag({ name: 'Tag A', color: '#ff0000' }, { getDb: () => adminDb });
      const rows = await listTags('active', { getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.name).toBe('Tag A');
    });
  });

  it('update clears description and color via deleteField mapping', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      const id = await createTag({ name: 'Tag B', color: '#abc', description: 'desc' }, { getDb: () => adminDb });
      await updateTag(id, { description: '', color: '' }, { getDb: () => adminDb });
      const snap = await getDoc(doc(adminDb, 'crm_tags', id));
      const data = snap.data() as any;
      expect('description' in (data || {})).toBe(false);
      expect('color' in (data || {})).toBe(false);
    });
  });

  it('archive/remove/restore affect list filters', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      const id = await createTag({ name: 'Tag C' }, { getDb: () => adminDb });

      await archiveTag(id, { getDb: () => adminDb });
      expect((await listTags('archived', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listTags('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await removeTag(id, { getDb: () => adminDb });
      expect((await listTags('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);

      await restoreTag(id, { getDb: () => adminDb });
      expect((await listTags('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listTags('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await deleteTag(id, { getDb: () => adminDb });
      expect((await listTags('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);
    });
  });
});

