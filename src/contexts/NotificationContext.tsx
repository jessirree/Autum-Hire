import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  durationMs?: number; // default 5000
}

interface NotificationContextValue {
  show: (n: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string, durationMs?: number) => void;
  showError: (message: string, title?: string, durationMs?: number) => void;
  showInfo: (message: string, title?: string, durationMs?: number) => void;
  showWarning: (message: string, title?: string, durationMs?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const show = useCallback((n: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const durationMs = n.durationMs ?? 5000;
    setNotifications(prev => [...prev, { ...n, id, durationMs }]);
    if (durationMs > 0) {
      window.setTimeout(() => remove(id), durationMs);
    }
  }, [remove]);

  const value = useMemo<NotificationContextValue>(() => ({
    show,
    showSuccess: (message, title, durationMs) => show({ type: 'success', message, title, durationMs }),
    showError: (message, title, durationMs) => show({ type: 'error', message, title, durationMs }),
    showInfo: (message, title, durationMs) => show({ type: 'info', message, title, durationMs }),
    showWarning: (message, title, durationMs) => show({ type: 'warning', message, title, durationMs })
  }), [show]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Notification container - bottom right */}
      <div style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 99999,
        pointerEvents: 'none'
      }}>
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} onClose={() => remove(n.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const typeToColors: Record<NotificationType, { bg: string; border: string; text: string; bar: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#166534', bar: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', text: '#7f1d1d', bar: '#ef4444' },
  info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a', bar: '#3b82f6' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#78350f', bar: '#f59e0b' },
};

const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  const { type, title, message, durationMs = 5000 } = notification;
  const colors = typeToColors[type];

  return (
    <div style={{
      width: 360,
      maxWidth: '90vw',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: 10,
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'start', gap: 10, padding: '12px 12px 8px 12px' }}>
        <div style={{ flex: 1 }}>
          {title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>}
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>{message}</div>
        </div>
        <button onClick={onClose} aria-label="Close notification" style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer'
        }}>×</button>
      </div>
      {/* Progress bar */}
      {durationMs > 0 && (
        <div style={{ height: 3, width: '100%', background: 'transparent' }}>
          <div style={{
            height: '100%',
            width: '100%',
            background: colors.bar,
            transformOrigin: 'left',
            animation: `shrink ${durationMs}ms linear forwards`
          }} />
        </div>
      )}

      <style>{`
        @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>
    </div>
  );
};

