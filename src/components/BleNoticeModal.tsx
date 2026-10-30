import React from 'react';
import { X, Smartphone, Printer, ExternalLink, ShieldAlert, Check } from 'lucide-react';

interface BleNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRawBt: () => void;
  onOpenBrowserPrint: () => void;
}

export const BleNoticeModal: React.FC<BleNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenRawBt,
  onOpenBrowserPrint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Akses Web Bluetooth Iframe Dibatasi</h3>
              <p className="text-[10px] text-slate-500">Kebijakan keamanan browser membatasi Web Bluetooth di iframe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
            <p className="text-[11px] text-amber-950 leading-relaxed">
              Browser membatasi direct Web Bluetooth API saat aplikasi dijalankan di dalam frame pratinjau (iframe <i>Permissions Policy</i>).
              Namun, <b>Anda tetap dapat mencetak struk dengan 100% lancar</b> menggunakan solusi resmi berikut:
            </p>
          </div>

          {/* Opsi 1: RawBT (Utama & Rekomendasi) */}
          <div className="border-2 border-emerald-500 bg-emerald-50/60 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Solusi 1: Cetak via Aplikasi RawBT</span>
              </span>
              <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                TERBAIK & UNIVERSAL
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Metode ini tidak memerlukan Web Bluetooth browser. Aplikasi RawBT langsung menerjemahkan perintah cetak ke printer Bluetooth apa pun (Panda, EPPOS, VSC, GOOJPRT, RPP02N, ZJiang, dll).
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenRawBt();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cetak Sekarang ke RawBT</span>
            </button>
          </div>

          {/* Opsi 2: Browser Print */}
          <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Solusi 2: Cetak Browser / PDF</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Gunakan dialog cetak bawaan perangkat. Format struk sudah dioptimasi khusus untuk kertas kasir 58mm & 80mm.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenBrowserPrint();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Dialog Cetak Browser</span>
            </button>
          </div>

          {/* Opsi 3: Buka Tab Penuh (Direct BLE) */}
          <div className="border border-indigo-200 bg-indigo-50/60 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>Solusi 3: Buka di Tab Baru Chrome</span>
              </span>
            </div>
            <p className="text-[11px] text-indigo-900/80">
              Membuka aplikasi di tab baru mandiri menghapus batasan iframe sehingga Web Bluetooth dapat langsung memindai printer Anda.
            </p>
            <button
              onClick={() => {
                onClose();
                window.open(window.location.href, '_blank');
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru Chrome</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
