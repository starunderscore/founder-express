// @ts-nocheck
"use client";
import type { StateCreator, StoreApi } from 'zustand';
import { listenSession, pushSessionState, createOrMergeSession } from '@/lib/firebase/firestore';
import type { Action } from '@/state/events';
import type { Store, SessionState } from '@/state/store';

type GetStore = () => Store;

class FirebaseBridge {
  private getStore: GetStore | null = null;
  private unsub: (() => void) | null = null;
  private syncing = false;

  attach(useStore: (sel?: any) => Store) {
    // store getter indirection to avoid import cycles
    this.getStore = () => useStore.getState();
    // Start listening to remote session if not already
    const state = this.getStore();
    this.watchSession(state.sessionId);
  }

  detach() {
    this.unsub?.();
    this.unsub = null;
    this.getStore = null;
  }

  async watchSession(sessionId: string) {
    try {
      await createOrMergeSession(sessionId, this.serialize());
    } catch {}
    this.unsub?.();
    this.unsub = listenSession(sessionId, (payload) => {
      if (!payload || this.syncing) return;
      const remote = payload.state as SessionState;
      const store = this.getStore?.();
      if (!store) return;
      store._replace(remote);
    });
  }

  serialize(): SessionState {
    const s = this.getStore?.();
    if (!s) return { sessionId: 'local', text: '', cursor: 0, mode: 'practice', aiEnabled: false };
    const { sessionId, text, cursor, mode, aiEnabled, lastSuggestion } = s;
    return { sessionId, text, cursor, mode, aiEnabled, lastSuggestion };
  }

  emit(action: Action, state: Store) {
    // broadcast local state to remote; throttle by flag
    if (this.syncing) return;
    this.syncing = true;
    const serialized = this.serialize();
    pushSessionState(state.sessionId, serialized)
      .catch(() => {})
      .finally(() => {
        this.syncing = false;
      });
  }
}

export const bridge = new FirebaseBridge();
