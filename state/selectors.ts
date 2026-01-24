import type { Store } from './store';

export const selectors = {
  text: (s: Store) => s.text,
  cursor: (s: Store) => s.cursor,
  mode: (s: Store) => s.mode,
  aiEnabled: (s: Store) => s.aiEnabled,
  suggestion: (s: Store) => s.lastSuggestion,
};

