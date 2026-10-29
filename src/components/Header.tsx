import React from 'react';
import { Printer, Volume2, VolumeX, Settings, History, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  onOpenSettingsModal: () => void;
  onOpenHistoryModal: () => void;
  historyCount: number;
  bleConnected: boolean;
  bleDeviceName: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettingsModal,
  onOpenHistoryModal,
  historyCount,
  bleConnected,
  bleDeviceName,
}) => {
  return (
    <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-40 no-print">
      <div className="max-w-md mx-auto px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-400/40 flex items-center justify-center shadow-inner">
            <Printer className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight tracking-tight flex items-center gap-1.5">
              <span>Kasir Cetak Struk</span>
              <span className="text-[10px] font-semibold bg-indigo-500/80 px-1.5 py-0.5 rounded text-indigo-100">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-indigo-200 truncate max-w-[170px]">
              {settings.storeName || 'Multi-Merek Thermal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Printer Status Badge */}
          <div
            className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${
              bleConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-indigo-900/60 text-indigo-200 border-indigo-500/40'
            }`}
            title={bleConnected ? `Terhubung: ${bleDeviceName}` : 'Printer Siap (RawBT / BLE / Web)'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${bleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-300'}`}
            />
            <span className="max-w-[70px] truncate">{bleConnected ? 'BLE Aktif' : 'Siap Cetak'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-1.5 rounded-lg border transition ${
              settings.soundEnabled
                ? 'bg-indigo-600 text-amber-300 border-indigo-400/50'
                : 'bg-indigo-800 text-indigo-300 border-indigo-600'
            }`}
            title={settings.soundEnabled ? 'Suara Soundbox Aktif' : 'Suara Senyap'}
            aria-label="Toggle Sound"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History Button with Counter */}
          <button
            onClick={onOpenHistoryModal}
            className="p-1.5 rounded-lg bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-600 relative transition"
            title="Riwayat Transaksi"
            aria-label="Riwayat"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 rounded-lg bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-600 transition"
            title="Pengaturan Profil Toko"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
