"use client";
import { useCallback } from 'react';
import { useSessionStore } from '@/state/store';
import { selectors } from '@/state/selectors';
import { ActionOrigin } from '@/state/events';

export function PatternTypingCanvas() {
  const text = useSessionStore(selectors.text);
  const cursor = useSessionStore(selectors.cursor);
  const dispatch = useSessionStore((s) => s.dispatch);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key.length === 1) {
        dispatch({
          type: 'input/insert',
          char: e.key,
          origin: ActionOrigin.User,
        });
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        dispatch({ type: 'input/delete', origin: ActionOrigin.User });
        e.preventDefault();
      }
    },
    [dispatch]
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <textarea
        value={text}
        onKeyDown={onKeyDown}
        onChange={() => {}}
        rows={8}
        style={{ width: '100%', padding: 12, fontFamily: 'monospace', fontSize: 16 }}
        aria-label="Pattern typing input"
      />
      <div style={{ color: '#475569' }}>Cursor: {cursor}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() =>
            dispatch({ type: 'mode/set', mode: 'practice', origin: ActionOrigin.User })
          }
          style={btn}
        >Practice</button>
        <button
          onClick={() =>
            dispatch({ type: 'mode/set', mode: 'guided', origin: ActionOrigin.User })
          }
          style={btn}
        >Guided</button>
        <button
          onClick={() =>
            dispatch({ type: 'ai/suggest', suggestion: 'Keep rhythm', origin: ActionOrigin.AI })
          }
          style={btn}
        >AI Suggest</button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
};

