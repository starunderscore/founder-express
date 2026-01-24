"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastColor = 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'orange' | 'grape';
type Toast = { id: string; title?: string; message?: string; color?: ToastColor; duration?: number };

type ToastAPI = {
  show: (opts: { title?: string; message?: string; color?: ToastColor; duration?: number }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, any>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
    const t = timers.current[id];
    if (t) { clearTimeout(t); delete timers.current[id]; }
  }, []);

  const show = useCallback((opts: { title?: string; message?: string; color?: ToastColor; duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const toast: Toast = { id, ...opts };
    setToasts((arr) => [...arr, toast]);
    const dur = typeof opts.duration === 'number' ? opts.duration : 3500;
    timers.current[id] = setTimeout(() => dismiss(id), dur);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Container */}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 5000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            pointerEvents: 'auto',
            minWidth: 280,
            maxWidth: 420,
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          }}>
            <ToastCard toast={t} onClose={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const bg = 'var(--mantine-color-body)';
  const fg = 'var(--mantine-color-text, inherit)';
  const border = '1px solid var(--mantine-color-gray-4)';
  return (
    <div style={{ background: bg, color: fg, border, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
        <div style={{ flex: 1 }}>
          {toast.title && <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{toast.title}</div>}
          {toast.message && <div style={{ opacity: 0.9, fontSize: 13 }}>{toast.message}</div>}
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          background: 'transparent', border: 0, color: fg, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
