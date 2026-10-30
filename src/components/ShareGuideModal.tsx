import React, { useState } from 'react';
import {
  X,
  Share2,
  Smartphone,
  Upload,
  Camera,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
  HelpCircle,
  Download,
} from 'lucide-react';

interface ShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onOpenInstallModal: () => void;
  isInstalled: boolean;
}

export const ShareGuideModal: React.FC<ShareGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  onOpenInstallModal,
  isInstalled,
}) => {
  const [activeTab, setActiveTab] = useState<'mbanking' | 'ewallet' | 'whatsapp' | 'manual'>('mbanking');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-teal-200 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3" /> FITUR SHARE TARGET ANDROID
              </div>
              <h2 className="text-base font-extrabold text-white">Cetak Struk dari Menu Share</h2>
              <p className="text-xs text-teal-100">Bisa terima gambar dari aplikasi apa pun di HP</p>
            </div>
          </div>
        </div>

        {/* Status Callout if not installed */}
        {!isInstalled && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 min-w-0">
              <Download className="w-4 h-4 text-amber-700 shrink-0" />
              <p className="text-[11px] leading-tight">
                <strong>Tips:</strong> Pasang aplikasi di HP agar <b>"Cetak Struk"</b> otomatis muncul di menu Bagikan HP Anda.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[10px] shrink-0 transition shadow-xs"
            >
              Pasang App
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold p-1 gap-1">
          <button
            onClick={() => setActiveTab('mbanking')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
              activeTab === 'mbanking'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            M-Banking
          </button>
          <button
            onClick={() => setActiveTab('ewallet')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
              activeTab === 'ewallet'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            E-Wallet
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
              activeTab === 'whatsapp'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition text-center ${
              activeTab === 'manual'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload/Foto
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
          {activeTab === 'mbanking' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Langkah Share dari BCA, Mandiri Livin, BRImo, BNI:
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-600">
                  <li>Lakukan transaksi transfer di aplikasi perbankan Anda hingga berhasil.</li>
                  <li>Di layar bukti transfer berhasil, ketuk tombol <strong>"Bagikan" / "Share"</strong> (atau screenshot layar Anda).</li>
                  <li>Pada pilihan aplikasi yang muncul di HP, pilih <strong>"Cetak Struk"</strong>.</li>
                  <li>Aplikasi Kasir ini akan otomatis terbuka, membaca nama penerima, rekening, bank tujuan, dan nominal secara instan!</li>
                  <li>Klik <strong>"Cetak Struk Thermal"</strong> untuk langsung mencetak ke kertas.</li>
                </ol>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                <p className="text-[11px] text-teal-900 leading-tight">
                  Mendukung semua bank nasional: <strong>BCA, BRI, Mandiri, BNI, BSI, CIMB Niaga, Permata, Jago, SeaBank</strong>, dll.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ewallet' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Langkah Share dari DANA, GoPay, OVO, ShopeePay:
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-600">
                  <li>Buka riwayat transaksi atau detail pembayaran di aplikasi e-wallet.</li>
                  <li>Ketuk tombol <strong>"Bagikan Bukti Pembayaran"</strong>.</li>
                  <li>Pilih aplikasi <strong>"Cetak Struk"</strong>.</li>
                  <li>AI Vision akan otomatis mendeteksi apakah itu transaksi Transfer, QRIS, atau Beli Pulsa/Token.</li>
                  <li>Data langsung terisi rapi siap dicetak ke printer Bluetooth!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Langkah Share Gambar dari WhatsApp / Galeri:
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-600">
                  <li>Pelanggan mengirim bukti transfer / screenshot token PLN via WhatsApp.</li>
                  <li>Buka gambar tersebut di WhatsApp & ketuk menu titik tiga (⋮) atau tombol <strong>Bagikan (Share)</strong>.</li>
                  <li>Pilih <strong>"Cetak Struk"</strong> dari menu aplikasi.</li>
                  <li>Aplikasi otomatis memproses gambar tanpa perlu Anda download atau ketik ulang!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-600">
                Anda juga bisa langsung mengunggah foto struk, mengambil foto baru menggunakan kamera, atau menempel screenshot dari clipboard:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center p-4 bg-teal-50 hover:bg-teal-100 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer transition text-teal-800">
                  <Upload className="w-6 h-6 mb-1 text-teal-600" />
                  <span className="font-bold text-xs">Pilih File Galeri</span>
                  <span className="text-[9px] text-teal-600">JPG, PNG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer transition text-indigo-800">
                  <Camera className="w-6 h-6 mb-1 text-indigo-600" />
                  <span className="font-bold text-xs">Foto dengan Kamera</span>
                  <span className="text-[9px] text-indigo-600">Ambil struk fisik</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition shadow-xs">
            <Upload className="w-4 h-4" />
            <span>Pilih Gambar Sekarang</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
