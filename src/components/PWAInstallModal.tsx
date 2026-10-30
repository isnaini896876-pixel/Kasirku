import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  MoreVertical,
  PlusSquare,
  Share2,
  Zap,
  WifiOff,
  HardDrive,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInstall: () => Promise<void>;
  hasNativePrompt: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isInIframe: boolean;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerInstall,
  hasNativePrompt,
  isAndroid,
  isIOS,
  isInIframe,
  isInstalled,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'install' | 'guide' | 'qr'>('install');

  // URL to share or open on Android
  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('localhost')
        ? 'https://ais-pre-es22esmkx6f6o37kb7buvt-299423960344.asia-southeast1.run.app'
        : window.location.href
      : 'https://ais-pre-es22esmkx6f6o37kb7buvt-299423960344.asia-southeast1.run.app';

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(currentUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn('QR code generate error:', err));
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  const handleShareToWhatsApp = () => {
    const text = encodeURIComponent(
      `Download & Pasang Aplikasi Kasir Cetak Struk Android:\n${currentUrl}\n\nBuka di Google Chrome HP lalu pilih "Install Aplikasi" / "Tambahkan ke Layar Utama".`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-700 p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-emerald-200 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Smartphone className="w-3 h-3" /> APLIKASI ANDROID (APK / PWA)
              </div>
              <h2 className="text-base font-extrabold text-white">Download & Pasang di Android</h2>
              <p className="text-xs text-emerald-100">Bisa diinstal di HP layaknya aplikasi Play Store</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold p-1 gap-1">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              activeTab === 'install'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang Sekarang</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Panduan Semua HP</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              activeTab === 'qr'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR HP</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Status Already Installed */}
          {isInstalled ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Aplikasi Sudah Terpasang di Android!</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Aplikasi ini sedang berjalan dalam mode Standalone/WebAPK penuh. Fitur <strong>Share Target Android</strong> dan cetak offline sudah aktif sepenuhnya!
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'install' && (
                <div className="space-y-3.5">
                  {/* Share Target Highlight Feature */}
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-teal-950 text-xs flex items-center gap-1">
                          <span>Fitur Baru: Cetak dari Menu "Bagikan" (Share)</span>
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                            PRO
                          </span>
                        </p>
                        <p className="text-[11px] text-teal-800 leading-tight mt-1">
                          Setelah dipasang di HP Android, Anda bisa langsung cetak struk dari aplikasi apa pun (BCA, Livin, BRImo, DANA, GoPay, WhatsApp, atau Galeri HP) dengan menekan tombol <strong>Bagikan / Share</strong> lalu pilih <strong>"Cetak Struk"</strong>!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If opened in Preview iFrame */}
                  {isInIframe && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs">Membuka di Bingkai Pratinjau</p>
                          <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                            Browser keamanan membatasi pemasangan langsung di dalam iframe pratinjau. Buka di tab Chrome penuh agar tombol instalasi otomatis muncul:
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenInNewTab}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Tab Baru Chrome</span>
                      </button>
                    </div>
                  )}

                  {/* 3 Value Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                      <WifiOff className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-800 text-[11px]">Bisa Offline</p>
                      <p className="text-[10px] text-slate-500">Cetak tanpa kuota</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
                      <Zap className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-800 text-[11px]">Respon Instan</p>
                      <p className="text-[10px] text-slate-500">Buka secepat kilat</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                      <HardDrive className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-800 text-[11px]">Hemat Memori</p>
                      <p className="text-[10px] text-slate-500">Hanya ~2 MB</p>
                    </div>
                  </div>

                  {/* Main Install Button */}
                  <div>
                    <button
                      onClick={async () => {
                        await onTriggerInstall();
                      }}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition active:scale-[0.98]"
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-sm">
                        {hasNativePrompt ? 'Download & Pasang Sekarang (WebAPK)' : 'Download / Pasang Otomatis'}
                      </span>
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-1.5">
                      Otomatis dibuat menjadi aplikasi Android resmi oleh sistem Google Play Services
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Cara Pasang di Google Chrome (Samsung, Xiaomi, Oppo, Vivo, Realme, Infinix):
                    </p>

                    <div className="space-y-2.5 text-[11px]">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">Buka Link di Google Chrome HP</p>
                          <p className="text-slate-500">
                            Buka browser Chrome, pastikan link beralamat di domain web online.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            Ketuk Menu Titik Tiga <MoreVertical className="w-3.5 h-3.5 text-slate-600 inline" /> di Pojok Kanan Atas
                          </p>
                          <p className="text-slate-500">
                            Pilih opsi <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">Ketuk "Instal / Pasang"</p>
                          <p className="text-slate-500">
                            Android akan otomatis mendownload paket <strong>WebAPK</strong> dan menempatkan ikon <strong>"Cetak Struk"</strong> di menu aplikasi HP Anda.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Samsung Internet Specific */}
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px]">
                    <p className="font-bold text-indigo-900 mb-1">Pengguna Samsung Internet Browser:</p>
                    <p className="text-indigo-800">
                      Ketuk menu garis tiga (☰) di pojok bawah kanan, pilih <strong>"Tambahkan halaman ke"</strong>, lalu pilih <strong>"Layar Aplikasi"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="text-center space-y-3 py-1">
                  <p className="text-xs text-slate-600">
                    Arahkan kamera smartphone Android Anda ke kode QR berikut untuk membuka dan mengunduh aplikasi:
                  </p>

                  <div className="inline-block p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Download Android"
                        className="w-48 h-48 mx-auto object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                        Membuat QR Code...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
                    </button>
                    <button
                      onClick={handleShareToWhatsApp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Kirim ke WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Direct Link Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-[11px] text-slate-900">Alamat Web / Link Download:</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gratis & Bebas Iklan</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-2.5 py-1 text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka Tab Penuh</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
