import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Store,
  Volume2,
  Save,
  RotateCcw,
  QrCode,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  Star,
  Copy,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StoreSettings, QrisMerchantAccount } from '../types';
import { SAMPLE_QRIS_PRESETS, generateStandardQris } from '../utils/qris';
import { playChimeSound } from '../utils/sound';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (newSettings: StoreSettings) => void;
  onResetDefaults: () => void;
  merchants: QrisMerchantAccount[];
  activeMerchantId?: string;
  onSelectMerchant: (merchant: QrisMerchantAccount) => void;
  onAddMerchant: (merchant: Omit<QrisMerchantAccount, 'id'>) => void;
  onUpdateMerchant: (merchant: QrisMerchantAccount) => void;
  onDeleteMerchant: (id: string) => void;
  onPrintMerchantStandee: (merchant: QrisMerchantAccount) => void;
  onPrintAllStandees: () => void;
  initialTab?: 'profil' | 'qris';
  onNotify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetDefaults,
  merchants,
  activeMerchantId,
  onSelectMerchant,
  onAddMerchant,
  onUpdateMerchant,
  onDeleteMerchant,
  onPrintMerchantStandee,
  onPrintAllStandees,
  initialTab = 'profil',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'qris'>(initialTab);
  const [formData, setFormData] = useState<StoreSettings>(settings);

  // Merchant creation / editing state
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [merchantForm, setMerchantForm] = useState<Omit<QrisMerchantAccount, 'id'>>({
    merchantName: '',
    nmid: 'ID1020039281921',
    acquirer: 'QRIS NASIONAL',
    city: 'JAKARTA',
    qrisPayload: '',
    isDefault: false,
    notes: '',
  });

  // Standee preview sub-modal
  const [previewMerchant, setPreviewMerchant] = useState<QrisMerchantAccount | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Generate QR preview when previewMerchant changes
  useEffect(() => {
    if (previewMerchant?.qrisPayload) {
      QRCode.toDataURL(previewMerchant.qrisPayload, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setPreviewQrUrl(url))
        .catch(() => setPreviewQrUrl(''));
    } else {
      setPreviewQrUrl('');
    }
  }, [previewMerchant]);

  if (!isOpen) return null;

  const handleSubmitStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleOpenAddMerchant = () => {
    setIsEditingMerchant(true);
    setEditingMerchantId(null);
    setMerchantForm({
      merchantName: formData.storeName ? `${formData.storeName} - KASIR 2` : 'WARUNG KOPI BERKAH',
      nmid: 'ID10200' + Math.floor(Math.random() * 90000000 + 10000000),
      acquirer: 'BCA QRIS',
      city: 'JAKARTA',
      qrisPayload: '',
      isDefault: merchants.length === 0,
      notes: 'Counter Utama / Meja Kasir',
    });
  };

  const handleOpenEditMerchant = (m: QrisMerchantAccount) => {
    setIsEditingMerchant(true);
    setEditingMerchantId(m.id);
    setMerchantForm({
      merchantName: m.merchantName,
      nmid: m.nmid,
      acquirer: m.acquirer,
      city: m.city,
      qrisPayload: m.qrisPayload,
      isDefault: m.isDefault || false,
      notes: m.notes || '',
    });
  };

  const handleApplyPreset = (preset: typeof SAMPLE_QRIS_PRESETS[0]) => {
    setMerchantForm({
      merchantName: preset.merchantName,
      nmid: preset.nmid,
      acquirer: preset.acquirer,
      city: preset.city,
      qrisPayload: preset.samplePayload,
      isDefault: merchantForm.isDefault,
      notes: `Akun ${preset.name}`,
    });
    if (onNotify) onNotify(`Preset "${preset.name}" dimuat ke formulir!`, 'info');
  };

  const handleSaveMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = merchantForm.merchantName.trim().toUpperCase() || 'MERCHANT QRIS';
    const cleanNmid = merchantForm.nmid.trim().toUpperCase() || 'ID1020039281921';
    const cleanAcquirer = merchantForm.acquirer.trim().toUpperCase() || 'QRIS NASIONAL';
    const cleanCity = merchantForm.city.trim().toUpperCase() || 'JAKARTA';
    const cleanNotes = merchantForm.notes?.trim() || '';

    let payload = merchantForm.qrisPayload.trim();
    if (!payload) {
      payload = generateStandardQris(cleanName, cleanNmid, cleanCity, false, 0);
    }

    if (editingMerchantId) {
      onUpdateMerchant({
        id: editingMerchantId,
        merchantName: cleanName,
        nmid: cleanNmid,
        acquirer: cleanAcquirer,
        city: cleanCity,
        qrisPayload: payload,
        isDefault: merchantForm.isDefault,
        notes: cleanNotes,
      });
      if (onNotify) onNotify(`Akun QRIS "${cleanName}" berhasil diperbarui!`, 'success');
    } else {
      onAddMerchant({
        merchantName: cleanName,
        nmid: cleanNmid,
        acquirer: cleanAcquirer,
        city: cleanCity,
        qrisPayload: payload,
        isDefault: merchantForm.isDefault,
        notes: cleanNotes,
        createdAt: new Date().toISOString(),
      });
      if (onNotify) onNotify(`Akun QRIS baru "${cleanName}" berhasil ditambahkan!`, 'success');
    }

    setIsEditingMerchant(false);
    setEditingMerchantId(null);
  };

  const handleCopyPreviewPayload = async () => {
    if (!previewMerchant?.qrisPayload) return;
    try {
      await navigator.clipboard.writeText(previewMerchant.qrisPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
      playChimeSound();
    } catch {}
  };

  const getAcquirerBadgeColor = (acquirer: string) => {
    const acq = acquirer.toUpperCase();
    if (acq.includes('BCA')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (acq.includes('DANA')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (acq.includes('SHOPEE')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (acq.includes('MANDIRI')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (acq.includes('BRI')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (acq.includes('BNI')) return 'bg-teal-100 text-teal-800 border-teal-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Pengaturan Toko & QRIS</h3>
              <p className="text-[10px] text-slate-500">Kelola profil konter dan banyak akun QRIS toko pelanggan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Header */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'profil'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil Toko & Struk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qris')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qris'
                ? 'bg-white text-rose-700 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Akun QRIS Toko</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                activeTab === 'qris' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {merchants.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {/* TAB 1: STORE PROFILE & GENERAL SETTINGS */}
          {activeTab === 'profil' && (
            <form onSubmit={handleSubmitStoreSettings} className="space-y-3.5 text-xs">
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

              {/* Bottom Actions */}
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
          )}

          {/* TAB 2: MULTI-MERCHANT QRIS MANAGEMENT & STANDEE PRINTING */}
          {activeTab === 'qris' && (
            <div className="space-y-3.5">
              {/* Highlight Banner with Batch Print CTA */}
              <div className="bg-gradient-to-r from-rose-50 via-indigo-50 to-amber-50 p-3 rounded-xl border border-rose-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h4 className="font-black text-xs text-rose-950 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-rose-600" />
                      <span>Kelola Banyak Akun QRIS Toko</span>
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      Beralih antar rekening/toko pelanggan dalam 1 klik, atau cetak barcode kertas standee untuk dipajang.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={onPrintAllStandees}
                      className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shadow-xs transition active:scale-95"
                      title="Cetak seluruh barcode akun QRIS yang tersimpan ke kertas printer thermal"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Semua ({merchants.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddMerchant}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shadow-xs transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Akun</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Editor for Adding or Editing Merchant */}
              {isEditingMerchant && (
                <div className="bg-white p-3.5 rounded-xl border-2 border-indigo-400 shadow-md space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                    <span className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{editingMerchantId ? 'Edit Akun QRIS Toko' : 'Tambah Akun QRIS Toko Baru'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingMerchant(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      Pilih Preset Cepat Akun:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {SAMPLE_QRIS_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-left transition truncate"
                        >
                          ⚡ {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSaveMerchant} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block">
                          Nama Toko / Merchant QRIS <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={merchantForm.merchantName}
                          onChange={(e) => setMerchantForm({ ...merchantForm, merchantName: e.target.value.toUpperCase() })}
                          className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-indigo-500 uppercase"
                          placeholder="KONTER BERKAH CELL"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block">
                          NMID (Nomor Merchant ID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={merchantForm.nmid}
                          onChange={(e) => setMerchantForm({ ...merchantForm, nmid: e.target.value.toUpperCase() })}
                          className="w-full mt-0.5 px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-indigo-500 uppercase"
                          placeholder="ID1020039281921"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block">
                          Acquirer / Bank Penerbit <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={merchantForm.acquirer}
                          onChange={(e) => setMerchantForm({ ...merchantForm, acquirer: e.target.value.toUpperCase() })}
                          className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-indigo-500 uppercase"
                          placeholder="BCA / DANA / SHOPEEPAY"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block">Kota Merchant</label>
                        <input
                          type="text"
                          value={merchantForm.city}
                          onChange={(e) => setMerchantForm({ ...merchantForm, city: e.target.value.toUpperCase() })}
                          className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:outline-indigo-500 uppercase"
                          placeholder="JAKARTA / SURABAYA"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block">
                        Catatan Lokasi / Fungsi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={merchantForm.notes}
                        onChange={(e) => setMerchantForm({ ...merchantForm, notes: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500"
                        placeholder="Contoh: Kasir Utama, Meja Barista, Rekening Khusus Pulsa"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-700">Kode Payload QRIS EMVCo</label>
                        <button
                          type="button"
                          onClick={() => {
                            const gen = generateStandardQris(
                              merchantForm.merchantName || 'MERCHANT QRIS',
                              merchantForm.nmid || 'ID1020039281921',
                              merchantForm.city || 'JAKARTA',
                              false,
                              0
                            );
                            setMerchantForm({ ...merchantForm, qrisPayload: gen });
                            if (onNotify) onNotify('Kode EMVCo QRIS berhasil digenerate otomatis!', 'info');
                          }}
                          className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800"
                        >
                          ⚡ Generate Otomatis
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={merchantForm.qrisPayload}
                        onChange={(e) => setMerchantForm({ ...merchantForm, qrisPayload: e.target.value.trim() })}
                        className="w-full mt-0.5 px-2.5 py-1 text-[11px] font-mono border border-slate-300 rounded-lg focus:outline-indigo-500 leading-tight"
                        placeholder="00020101021126600014ID.CO.QRIS.WWW..."
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={merchantForm.isDefault}
                        onChange={(e) => setMerchantForm({ ...merchantForm, isDefault: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        Jadikan akun QRIS default utama toko
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditingMerchant(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-extrabold rounded-lg shadow-xs transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Akun QRIS</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List of Saved Merchants */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                    Daftar Akun QRIS ({merchants.length} Tersimpan)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Klik tombol printer untuk cetak standee
                  </span>
                </div>

                {merchants.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Belum ada akun QRIS tersimpan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tambahkan akun QRIS toko Anda agar kasir bisa berganti akun dan mencetak barcode dengan mudah.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddMerchant}
                      className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Akun Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {merchants.map((merchant) => {
                      const isActive = merchant.id === activeMerchantId;
                      const isDefault = merchant.isDefault;

                      return (
                        <div
                          key={merchant.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Merchant details */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-900 uppercase">
                                  {merchant.merchantName}
                                </span>

                                <span
                                  className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${getAcquirerBadgeColor(
                                    merchant.acquirer
                                  )}`}
                                >
                                  {merchant.acquirer}
                                </span>

                                {isDefault && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                    <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                                    <span>Utama</span>
                                  </span>
                                )}

                                {isActive && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Aktif di Kasir</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                <span className="font-mono">NMID: {merchant.nmid || '-'}</span>
                                {merchant.city && <span>• Kota: {merchant.city}</span>}
                                {merchant.notes && (
                                  <span className="italic text-slate-600">• "{merchant.notes}"</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              {/* Switch Active Account Button */}
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => onSelectMerchant(merchant)}
                                  className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1"
                                  title="Gunakan akun ini untuk kasir transaksi QRIS"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Gunakan</span>
                                </button>
                              )}

                              {/* Print Standee Card for this Merchant */}
                              <button
                                type="button"
                                onClick={() => onPrintMerchantStandee(merchant)}
                                className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-xs active:scale-95"
                                title="Cetak kartu barcode QRIS merchant ini ke printer thermal"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak QR</span>
                              </button>

                              {/* Preview QR on Screen */}
                              <button
                                type="button"
                                onClick={() => setPreviewMerchant(merchant)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                                title="Lihat barcode QRIS di layar"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Merchant */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditMerchant(merchant)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
                                title="Edit akun QRIS"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Merchant */}
                              {merchants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Hapus akun QRIS "${merchant.merchantName}"?`)) {
                                      onDeleteMerchant(merchant.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                                  title="Hapus akun QRIS"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-[10px] text-slate-500 font-medium">
            {activeTab === 'qris'
              ? `${merchants.length} akun tersimpan • Siap cetak thermal 58/80mm`
              : 'Perubahan toko otomatis tersimpan ke memori HP'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-extrabold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* SUB-MODAL: STANDALONE QRIS PREVIEW */}
      {previewMerchant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {previewMerchant.acquirer}
                </span>
                <h4 className="font-black text-sm text-slate-900 mt-1 uppercase">
                  {previewMerchant.merchantName}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">NMID: {previewMerchant.nmid}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMerchant(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rendered Barcode */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              {previewQrUrl ? (
                <img
                  src={previewQrUrl}
                  alt={previewMerchant.merchantName}
                  className="w-48 h-48 rounded-lg shadow-xs bg-white p-1"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-bold">
                  Memuat Barcode...
                </div>
              )}
              <span className="text-[10px] font-bold text-slate-500 mt-2">
                [ SCAN UNTUK BAYAR QRIS ]
              </span>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onPrintMerchantStandee(previewMerchant);
                  setPreviewMerchant(null);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Standee Barcode Ini</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPreviewPayload}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Kode Berhasil Disalin!' : 'Salin Kode Payload EMVCo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
