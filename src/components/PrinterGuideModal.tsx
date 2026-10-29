import React from 'react';
import { X, Smartphone, Bluetooth, Check, ExternalLink } from 'lucide-react';

interface PrinterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterGuideModal: React.FC<PrinterGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Panduan Driver Printer Thermal</h3>
              <p className="text-[10px] text-slate-500">Mendukung 100% printer Bluetooth kasir di pasaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs text-slate-700">
          {/* Merek yang didukung */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl">
            <p className="font-bold text-indigo-950 mb-1">Merek Printer yang Kompatibel:</p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                'Panda PRJ-58D / 80',
                'EPPOS EP5802AI',
                'VSC MP-58C / MP-80',
                'GOOJPRT PT-210',
                'RPP02N / MPT-II',
                'ZJiang ZJ-5802 / 5805',
                'Iware C-58BT',
                'Bellav POS-58',
                'Xprinter XP-58',
                'Semua POS Bluetooth 58mm & 80mm',
              ].map((brand) => (
                <span
                  key={brand}
                  className="bg-white text-indigo-900 font-bold px-2 py-0.5 rounded border border-indigo-200"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Opsi 1: RawBT (Paling Direkomendasikan) */}
          <div className="border border-emerald-200 bg-emerald-50/50 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Metode 1: Aplikasi RawBT (Sangat Stabil)</span>
              </span>
              <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                REKOMENDASI
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              RawBT adalah standar driver thermal di Indonesia. Menghubungkan HP Android ke printer thermal Bluetooth
              hanya dalam sekali klik.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-slate-700">
              <li>Nyalakan Bluetooth di HP Anda dan pasangkan (pairing) printer dengan PIN <code className="bg-emerald-100 px-1 rounded font-bold">0000</code> atau <code className="bg-emerald-100 px-1 rounded font-bold">1234</code>.</li>
              <li>Install aplikasi <b>RawBT Print Service</b> gratis dari Google Play Store.</li>
              <li>Buka RawBT, pilih koneksi <b>Bluetooth</b> dan pilih printer Anda.</li>
              <li>Selesai! Sekarang di web ini cukup tekan tombol hijau <b>"CETAK KE PRINTER THERMAL (RAWBT)"</b>.</li>
            </ol>
          </div>

          {/* Opsi 2: Web Bluetooth Direct (Chrome) */}
          <div className="border border-indigo-200 bg-white p-3 rounded-xl space-y-2">
            <span className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
              <Bluetooth className="w-4 h-4 text-indigo-600" />
              <span>Metode 2: Web Bluetooth BLE Direct (Tanpa Aplikasi)</span>
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jika printer Anda dilengkapi modul BLE (Bluetooth Low Energy):
            </p>
            <ul className="space-y-1 text-[11px] text-slate-700">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Aktifkan <b>Bluetooth</b> dan <b>Lokasi (GPS)</b> pada HP Anda.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tekan tombol <b>"Hubungkan BLE"</b> di bagian atas aplikasi.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pilih nama printer (misal: <i>RPP02N, MPT-II, POS-58</i>) dari daftar popup browser.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Setelah status menjadi hijau, tekan <b>"Cetak Direct BLE"</b>.</span>
              </li>
            </ul>
          </div>

          {/* Opsi 3: Kirim WhatsApp / Download Gambar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-[11px]">
            <p className="font-bold text-slate-900">Alternatif Tanpa Kertas:</p>
            <p>
              Gunakan tombol <b>"Salin Teks WhatsApp"</b> untuk mengirim bukti transaksi digital langsung ke chat
              WhatsApp pelanggan Anda, atau <b>"Simpan Gambar PNG"</b> untuk menyimpan struk sebagai foto.
            </p>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
