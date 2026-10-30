import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  CloudCheck,
  Smartphone,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface OnlineShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  serverStatus: 'connected' | 'checking' | 'disconnected';
  latency: number | null;
  onRefreshHealth: () => void;
}

export const OnlineShareModal: React.FC<OnlineShareModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  serverStatus,
  latency,
  onRefreshHealth,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Primary shared URL (fallback to current window origin)
  const sharedUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('localhost')
        ? 'https://ais-pre-es22esmkx6f6o37kb7buvt-299423960344.asia-southeast1.run.app'
        : window.location.href
      : 'https://ais-pre-es22esmkx6f6o37kb7buvt-299423960344.asia-southeast1.run.app';

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(sharedUrl, {
      width: 280,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn('QR generate error:', err));
  }, [isOpen, sharedUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = sharedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Aplikasi Kasir Cetak Struk Online (Token PLN, Transfer, QRIS & Toko):\n${sharedUrl}\n\nBuka langsung di browser Chrome HP untuk mulai transaksi & cetak struk!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs no-print animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-700 text-white flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-400 text-slate-950 font-black text-[9px] px-2 py-0.2 rounded-full uppercase tracking-wider">
                ● AKTIF DI CLOUD 24/7
              </div>
              <h3 className="font-extrabold text-sm leading-tight text-white mt-0.5">
                Aplikasi Online & Siap Pakai
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {/* Status Box */}
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <p className="font-extrabold text-xs text-emerald-950">
                  {isOnline && serverStatus === 'connected'
                    ? 'Server Cloud Aktif & Terhubung'
                    : 'Memeriksa Status Koneksi...'}
                </p>
                <p className="text-[10px] text-emerald-800">
                  {latency ? `Respon Server: ${latency} ms | Google Cloud Platform` : 'Koneksi Online Normal'}
                </p>
              </div>
            </div>
            <button
              onClick={onRefreshHealth}
              className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-200/60 rounded-lg transition"
              title="Perbarui status koneksi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <p className="font-bold text-xs text-slate-900 mb-1">
              Pindai QR untuk Buka Aplikasi di HP
            </p>
            <p className="text-[10px] text-slate-500 max-w-xs mb-2">
              Arahkan kamera smartphone ke kode QR di bawah untuk membuka aplikasi kasir secara online:
            </p>

            {qrCodeUrl ? (
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                <img src={qrCodeUrl} alt="QR Code Link Online" className="w-44 h-44 object-contain" />
              </div>
            ) : (
              <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-xl" />
            )}

            <div className="mt-2.5 w-full bg-white border border-slate-200 p-2 rounded-lg flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-indigo-700 truncate font-semibold">
                {sharedUrl}
              </span>
              <button
                onClick={handleCopy}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 shrink-0 transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan ke WA</span>
            </button>

            <button
              onClick={() => window.open(sharedUrl, '_blank')}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-[11px] text-indigo-950">
            <p className="font-extrabold flex items-center gap-1.5 text-xs text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Keunggulan Aplikasi Online Ini:</span>
            </p>
            <ul className="space-y-1 text-slate-700 pl-4 list-disc marker:text-indigo-500">
              <li>
                <b>Multi-Perangkat:</b> Dapat dibuka di smartphone kasir, tablet toko, maupun komputer kasir sekaligus.
              </li>
              <li>
                <b>Penyimpanan Permanen:</b> Pengaturan toko dan QRIS master otomatis disimpan aman di perangkat.
              </li>
              <li>
                <b>PWA Offline Ready:</b> Setelah dibuka sekali, aplikasi dapat dipasang ke layar utama HP dan tetap bisa mencetak struk meski sinyal terputus.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
