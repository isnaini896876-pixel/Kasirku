import React, { useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    isIOS,
    isInIframe,
    promptInstall,
    hasNativePrompt,
  } = usePWAInstall();

  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const outcome = await promptInstall();
      if (outcome === 'manual' || outcome === 'dismissed') {
        // Fallback to modal with instructions if user or browser needs manual flow
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // If already running inside standalone app, we can show a small "Terpasang" indicator in header or nothing
  if (isInstalled && variant === 'banner') {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold text-[11px] transition shadow-sm ${
            isInstalled
              ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/40'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-amber-300 active:scale-95 animate-pulse'
          }`}
          title={isInstalled ? 'Aplikasi Terpasang di HP' : 'Pasang Aplikasi di HP Android'}
          aria-label="Install Aplikasi"
        >
          {isInstalled ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Terpasang</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-slate-900" />
              <span className="font-extrabold">Pasang App</span>
            </>
          )}
        </button>
      )}

      {variant === 'banner' && !bannerDismissed && !isInstalled && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white px-3 py-2.5 rounded-xl border border-indigo-500/40 shadow-sm flex items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-white flex items-center gap-1 leading-tight">
                <span>Jadikan Aplikasi Android</span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                  Gratis
                </span>
              </p>
              <p className="text-[10px] text-indigo-200 truncate">
                Bisa dibuka offline dari layar utama tanpa kuota internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="text-indigo-300 hover:text-white p-1 rounded-md"
              aria-label="Tutup Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {variant === 'card' && !isInstalled && (
        <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-800">Pasang di Smartphone</p>
              <p className="text-[10px] text-slate-500">Akses cepat struk token & kasir dari beranda HP</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 transition"
          >
            Pasang
          </button>
        </div>
      )}

      {/* Instructions Modal */}
      <PWAInstallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTriggerInstall={async () => {
          if (hasNativePrompt) {
            await promptInstall();
          }
        }}
        hasNativePrompt={hasNativePrompt}
        isAndroid={isAndroid}
        isIOS={isIOS}
        isInIframe={isInIframe}
        isInstalled={isInstalled}
      />
    </>
  );
};
