import React, { createContext, useContext, useCallback, useRef } from 'react';

interface ReloadContextType {
  reload: () => void;
  subscribe: (cb: () => void) => () => void;
}

const ReloadContext = createContext<ReloadContextType | undefined>(undefined);

export const ReloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<Set<() => void>>(new Set());

  const reload = useCallback(() => {
    listeners.current.forEach(cb => cb());
  }, []);

  const subscribe = useCallback((cb: () => void) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  }, []);

  return (
    <ReloadContext.Provider value={{ reload, subscribe }}>
      {children}
    </ReloadContext.Provider>
  );
};

export function useReload() {
  const ctx = useContext(ReloadContext);
  if (!ctx) throw new Error('useReload must be used within ReloadProvider');
  return ctx;
}
