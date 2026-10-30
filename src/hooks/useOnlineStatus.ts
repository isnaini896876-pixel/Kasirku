import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatusState {
  isOnline: boolean;
  serverStatus: 'connected' | 'checking' | 'disconnected';
  latency: number | null;
  lastChecked: string | null;
}

export function useOnlineStatus() {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    serverStatus: 'checking',
    latency: null,
    lastChecked: null,
  });

  const checkServerHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        serverStatus: 'disconnected',
        latency: null,
      }));
      return;
    }

    const start = performance.now();
    try {
      const response = await fetch('/api/health?t=' + Date.now(), {
        cache: 'no-store',
      });
      const end = performance.now();
      if (response.ok) {
        const json = await response.json();
        setState({
          isOnline: true,
          serverStatus: json.status === 'ok' ? 'connected' : 'checking',
          latency: Math.round(end - start),
          lastChecked: new Date().toLocaleTimeString('id-ID'),
        });
      } else {
        setState((prev) => ({
          ...prev,
          serverStatus: 'disconnected',
          latency: null,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        serverStatus: 'disconnected',
        latency: null,
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      checkServerHealth();
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        serverStatus: 'disconnected',
        latency: null,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkServerHealth();

    // Ping check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkServerHealth]);

  return {
    ...state,
    checkNow: checkServerHealth,
  };
}
