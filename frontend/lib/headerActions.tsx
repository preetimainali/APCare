"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface HeaderActionsContextValue {
  exportAction: (() => void) | null;
  shareAction: (() => void) | null;
  alertsDrawerAction: (() => void) | null;
  setExportAction: (cb: (() => void) | null) => void;
  setShareAction: (cb: (() => void) | null) => void;
  setAlertsDrawerAction: (cb: (() => void) | null) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextValue>({
  exportAction: null,
  shareAction: null,
  alertsDrawerAction: null,
  setExportAction: () => {},
  setShareAction: () => {},
  setAlertsDrawerAction: () => {},
});

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [exportAction, setExportRaw] = useState<(() => void) | null>(null);
  const [shareAction, setShareRaw] = useState<(() => void) | null>(null);
  const [alertsDrawerAction, setAlertsDrawerRaw] = useState<(() => void) | null>(null);

  const setExportAction = useCallback((cb: (() => void) | null) => {
    setExportRaw(() => cb);
  }, []);

  const setShareAction = useCallback((cb: (() => void) | null) => {
    setShareRaw(() => cb);
  }, []);

  const setAlertsDrawerAction = useCallback((cb: (() => void) | null) => {
    setAlertsDrawerRaw(() => cb);
  }, []);

  return (
    <HeaderActionsContext.Provider value={{ exportAction, shareAction, alertsDrawerAction, setExportAction, setShareAction, setAlertsDrawerAction }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}
