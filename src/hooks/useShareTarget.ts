import { useEffect, useState, useCallback } from 'react';

interface UseShareTargetOptions {
  onImageReceived: (file: File) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useShareTarget({ onImageReceived, onNotify }: UseShareTargetOptions) {
  const [isProcessingShared, setIsProcessingShared] = useState(false);
  const [showShareGuide, setShowShareGuide] = useState(false);

  const checkSharedImageCache = useCallback(async () => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('shared-image-cache');
      const response = await cache.match('/shared-image-data');

      if (response) {
        setIsProcessingShared(true);
        onNotify?.('📥 Gambar bukti transaksi diterima dari Share HP! Memproses struk...', 'info');

        const blob = await response.blob();
        const headerFilename = response.headers.get('X-Filename');
        const filename = headerFilename
          ? decodeURIComponent(headerFilename)
          : `shared_receipt_${Date.now()}.jpg`;

        const file = new File([blob], filename, {
          type: blob.type || 'image/jpeg',
          lastModified: Date.now(),
        });

        // Clean cache so we don't process it twice
        await cache.delete('/shared-image-data');

        // Clean query params from URL without reload
        if (window.location.search.includes('shared=receipt')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('shared');
          url.searchParams.delete('t');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }

        // Pass to OCR processor
        onImageReceived(file);
      }
    } catch (err) {
      console.warn('Error reading shared image cache:', err);
    } finally {
      setIsProcessingShared(false);
    }
  }, [onImageReceived, onNotify]);

  // Check on mount and when visibility changes (user switches back from another app's share sheet)
  useEffect(() => {
    checkSharedImageCache();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSharedImageCache();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSharedImageCache);

    // Also listen to postMessage from Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SHARED_RECEIPT_RECEIVED') {
        checkSharedImageCache();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSharedImageCache);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [checkSharedImageCache]);

  return {
    isProcessingShared,
    showShareGuide,
    setShowShareGuide,
    checkSharedImageCache,
  };
}
