import React from 'react';
import { X, Store, Volume2, Save, RotateCcw } from 'lucide-react';
import { StoreSettings } from '../types';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (newSettings: StoreSettings) => void;
  onResetDefaults: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetDefaults,
}) => {
  const [formData, setFormData] = React.useState<StoreSettings>(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Pengaturan Profil & Struk</h3>
              <p className="text-[10px] text-slate-500">Sesuaikan nama konter, kop struk, dan suara kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Store Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">Nama Toko / Konter</label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-indigo-500 uppercase"
              placeholder="BERKAH CELLULAR"
              required
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">Slogan / Keterangan Toko</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500"
              placeholder="PPOB, Token Listrik, Pulsa & Transfer Bank"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">Alamat Toko</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500"
              placeholder="Jl. Raya Pasar No. 12"
            />
          </div>

          {/* Phone / WA */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">No. WhatsApp / HP</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-indigo-500"
              placeholder="0812-3456-7890"
            />
          </div>

          {/* Footer Message */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">Pesan Bawah Struk (Footer)</label>
            <textarea
              rows={2}
              value={formData.footerMessage}
              onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500"
              placeholder="Terima kasih atas kunjungan Anda"
            />
          </div>

          {/* Paper Width & Barcode */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Lebar Kertas Default</label>
              <div className="flex gap-1">
                {(['58mm', '80mm'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setFormData({ ...formData, paperWidth: w })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                      formData.paperWidth === w
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Barcode di Struk</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showBarcode: !formData.showBarcode })}
                className={`w-full py-1 text-xs font-bold rounded-lg border transition ${
                  formData.showBarcode
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {formData.showBarcode ? 'Tampilkan Barcode' : 'Sembunyikan'}
              </button>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Suara Soundbox Kasir</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="font-semibold text-xs">Aktifkan efek suara bel dan notifikasi suara</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={formData.autoAnnounceOnPrint}
                onChange={(e) => setFormData({ ...formData, autoAnnounceOnPrint: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="font-semibold text-xs">Otomatis umumkan nominal suara saat tombol cetak ditekan</span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-extrabold rounded-xl shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
