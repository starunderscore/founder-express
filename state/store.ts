"use client";
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Action } from './events';
import { ActionOrigin, withMeta } from './events';

export type SessionState = {
  sessionId: string;
  text: string;
  cursor: number;
  mode: 'practice' | 'guided';
  aiEnabled: boolean;
  // tracked suggestions/messages
  lastSuggestion?: string;
};

export type Store = SessionState & {
  dispatch: (action: Action) => void;
  // internal: reduces action to new state
  _reduce: (draft: SessionState, action: Action) => void;
  // replace full state (from remote)
  _replace: (state: SessionState) => void;
};

const initial: SessionState = {
  sessionId: 'local',
  text: '',
  cursor: 0,
  mode: 'practice',
  aiEnabled: false,
};

export const useSessionStore = create<Store>()(
  immer((set, get) => ({
    ...initial,
    dispatch: (action) => {
      const actorId = undefined; // could be current uid; injected at bridge level
      const withTs = action.ts ? action : withMeta(action, actorId);
      set((draft) => get()._reduce(draft, withTs));
      // no remote session sync per requirements
    },
    _reduce: (draft, action) => {
      switch (action.type) {
        case 'input/insert': {
          draft.text =
            draft.text.slice(0, draft.cursor) + action.char + draft.text.slice(draft.cursor);
          draft.cursor += 1;
          return;
        }
        case 'input/delete': {
          if (draft.cursor > 0) {
            draft.text = draft.text.slice(0, draft.cursor - 1) + draft.text.slice(draft.cursor);
            draft.cursor -= 1;
          }
          return;
        }
        case 'input/setText': {
          draft.text = action.text;
          draft.cursor = action.cursorAt === 'start' ? 0 : action.text.length;
          return;
        }
        case 'mode/set': {
          draft.mode = action.mode;
          return;
        }
        case 'ai/enable': {
          draft.aiEnabled = true;
          return;
        }
        case 'ai/disable': {
          draft.aiEnabled = false;
          return;
        }
        case 'ai/suggest': {
          draft.lastSuggestion = action.suggestion;
          return;
        }
        case 'control/request':
        case 'control/grant':
        case 'control/release': {
          // TODO: extend with permission/role state when enabling remote control
          return;
        }
        default:
          return;
      }
    },
    _replace: (state) => set(() => ({ ...state })),
  }))
);

// No session sync: intentionally no-op
