import React, { useState, useEffect } from 'react';
import { getCurrentIndonesianDateTime, formatRupiah, terbilangRupiah } from '../utils/formatters';
import {
  Clock,
  QrCode,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  ShieldCheck,
  Eye,
  CheckCircle2,
  DollarSign,
  Info,
  Edit3,
  Save,
  BookmarkCheck,
  RotateCcw,
  Printer,
  Store,
  Settings,
  Star,
  Check,
} from 'lucide-react';
import { QrisData, MasterQrisConfig, QrisMerchantAccount } from '../types';
import {
  convertToDynamicQris,
  convertToStaticQris,
  generateStandardQris,
  SAMPLE_QRIS_PRESETS,
  analyzeQrisPayload,
} from '../utils/qris';

interface QrisFormProps {
  data: QrisData;
  onChange: (data: QrisData) => void;
  onOpenQrModal: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  masterQris: MasterQrisConfig;
  onSaveMasterQris: (newMaster: MasterQrisConfig) => void;
  savedMerchants?: QrisMerchantAccount[];
  activeMerchantId?: string;
  onSelectMerchant?: (merchant: QrisMerchantAccount) => void;
  onOpenSettingsModal?: () => void;
  onPrintMerchantStandee?: (merchant: QrisMerchantAccount) => void;
}

export const QrisForm: React.FC<QrisFormProps> = ({
  data,
  onChange,
  onOpenQrModal,
  onNotify,
  masterQris,
  onSaveMasterQris,
  savedMerchants = [],
  activeMerchantId,
  onSelectMerchant,
  onOpenSettingsModal,
  onPrintMerchantStandee,
}) => {
  const [showAdvancedPayload, setShowAdvancedPayload] = useState(false);
  const [showEditMaster, setShowEditMaster] = useState(false);
  const [inputCustomPayload, setInputCustomPayload] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Local state for editing master permanent QRIS
  const [masterDraft, setMasterDraft] = useState<MasterQrisConfig>(masterQris);

  useEffect(() => {
    setMasterDraft(masterQris);
  }, [masterQris]);

  // Helper to re-encode QRIS payload with updated fields
  const applyPayloadUpdate = (
    basePayload: string,
    isDynamic: boolean,
    nominal: number,
    refNo: string,
    merchantName: string,
    nmid: string,
    city: string
  ): string => {
    let payload = basePayload;
    if (!payload) {
      payload = generateStandardQris(
        merchantName || 'KONTER BERKAH',
        nmid || 'ID1020039281921',
        city || 'JAKARTA',
        isDynamic,
        nominal
      );
    }

    try {
      if (isDynamic) {
        return convertToDynamicQris(payload, nominal > 0 ? nominal : 1, refNo);
      } else {
        return convertToStaticQris(payload);
      }
    } catch {
      return payload;
    }
  };

  // Save current form values as permanent master QRIS
  const handleSaveCurrentAsMaster = () => {
    const newMaster: MasterQrisConfig = {
      merchantName: data.merchantName || 'KONTER BERKAH',
      nmid: data.nmid || 'ID1020039281921',
      acquirer: data.acquirer || 'QRIS NASIONAL',
      city: data.city || 'JAKARTA',
      qrisPayload: data.qrisPayload || generateStandardQris(data.merchantName, data.nmid, data.city, false, 0),
      isConfigured: true,
      savedAt: new Date().toISOString(),
    };
    onSaveMasterQris(newMaster);
    if (onNotify) {
      onNotify(`QRIS "${newMaster.merchantName}" berhasil disimpan permanen! Data otomatis diingat setiap buka aplikasi.`, 'success');
    }
  };

  // Save changes from master draft editor
  const handleSaveMasterDraft = () => {
    const cleanMerchant = masterDraft.merchantName.trim().toUpperCase() || 'KONTER BERKAH';
    const cleanNmid = masterDraft.nmid.trim().toUpperCase() || 'ID1020039281921';
    const cleanAcquirer = masterDraft.acquirer.trim().toUpperCase() || 'QRIS NASIONAL';
    const cleanCity = masterDraft.city.trim().toUpperCase() || 'JAKARTA';

    let basePayload = masterDraft.qrisPayload.trim();
    if (!basePayload) {
      basePayload = generateStandardQris(cleanMerchant, cleanNmid, cleanCity, false, 0);
    }

    const newMaster: MasterQrisConfig = {
      merchantName: cleanMerchant,
      nmid: cleanNmid,
      acquirer: cleanAcquirer,
      city: cleanCity,
      qrisPayload: basePayload,
      isConfigured: true,
      savedAt: new Date().toISOString(),
    };

    onSaveMasterQris(newMaster);
    setShowEditMaster(false);

    if (onNotify) {
      onNotify(`Profil QRIS Toko "${cleanMerchant}" berhasil disimpan permanen!`, 'success');
    }
  };

  // Reset form to current master permanent QRIS
  const handleApplyMasterToForm = () => {
    const isDynamic = data.qrisType === 'dinamis';
    const targetNominal = data.total > 0 ? data.total : data.nominal;

    const newPayload = applyPayloadUpdate(
      masterQris.qrisPayload,
      isDynamic,
      targetNominal,
      data.refNo,
      masterQris.merchantName,
      masterQris.nmid,
      masterQris.city || 'JAKARTA'
    );

    onChange({
      ...data,
      merchantName: masterQris.merchantName,
      nmid: masterQris.nmid,
      acquirer: masterQris.acquirer,
      city: masterQris.city,
      qrisPayload: newPayload,
    });

    if (onNotify) {
      onNotify(`QRIS Tetap Toko "${masterQris.merchantName}" diterapkan ke form!`, 'info');
    }
  };

  // Update a field and re-sync payload in real-time
  const updateField = (field: keyof QrisData, value: any) => {
    const updated: QrisData = { ...data, [field]: value };

    // Recalculate total if nominal or fee changes
    if (field === 'nominal' || field === 'fee') {
      const nom = field === 'nominal' ? Number(value) || 0 : data.nominal;
      const f = field === 'fee' ? Number(value) || 0 : data.fee;
      updated.total = nom + f;
    }

    // Sync payload whenever nominal, fee, merchantName, refNo, or qrisType changes
    if (
      field === 'nominal' ||
      field === 'fee' ||
      field === 'qrisType' ||
      field === 'merchantName' ||
      field === 'refNo' ||
      field === 'nmid'
    ) {
      const isDynamic = field === 'qrisType' ? value === 'dinamis' : updated.qrisType === 'dinamis';
      const targetNominal = updated.total > 0 ? updated.total : updated.nominal;

      updated.qrisPayload = applyPayloadUpdate(
        updated.qrisPayload,
        isDynamic,
        targetNominal,
        updated.refNo,
        updated.merchantName,
        updated.nmid,
        updated.city || 'JAKARTA'
      );
    }

    onChange(updated);
  };

  // Switch between QRIS Dinamis & QRIS Statis
  const handleSelectType = (type: 'dinamis' | 'statis') => {
    const isDynamic = type === 'dinamis';
    let newNominal = data.nominal;

    // If switching to dynamic and nominal is 0, give standard initial nominal
    if (isDynamic && newNominal <= 0) {
      newNominal = 25000;
    }

    const newTotal = newNominal + (data.fee || 0);
    const newPayload = applyPayloadUpdate(
      data.qrisPayload,
      isDynamic,
      newTotal,
      data.refNo,
      data.merchantName,
      data.nmid,
      data.city || 'JAKARTA'
    );

    onChange({
      ...data,
      qrisType: type,
      nominal: newNominal,
      total: newTotal,
      qrisPayload: newPayload,
    });

    if (onNotify) {
      onNotify(
        isDynamic
          ? 'Mode QRIS Dinamis aktif: Nominal terkunci otomatis di QR Code.'
          : 'Mode QRIS Statis aktif: Pelanggan mengetikkan nominal sendiri.',
        'info'
      );
    }
  };

  const setWaktuSekarang = () => {
    updateField('waktu', getCurrentIndonesianDateTime());
  };

  // Quick preset loader
  const handleLoadPreset = (preset: typeof SAMPLE_QRIS_PRESETS[0]) => {
    const isDynamic = data.qrisType === 'dinamis';
    const targetNominal = data.total > 0 ? data.total : data.nominal;

    const payload = applyPayloadUpdate(
      preset.samplePayload,
      isDynamic,
      targetNominal,
      data.refNo,
      preset.merchantName,
      preset.nmid,
      preset.city
    );

    onChange({
      ...data,
      merchantName: preset.merchantName,
      nmid: preset.nmid,
      acquirer: preset.acquirer,
      city: preset.city,
      qrisPayload: payload,
    });

    if (onNotify) {
      onNotify(`Template ${preset.name} berhasil dimuat!`, 'success');
    }
  };

  // Parse user pasted QRIS String
  const handleApplyCustomPayload = () => {
    if (!inputCustomPayload.trim()) return;

    try {
      const info = analyzeQrisPayload(inputCustomPayload.trim());
      const isDynamic = data.qrisType === 'dinamis';
      const targetNominal = data.total > 0 ? data.total : data.nominal;

      const finalPayload = applyPayloadUpdate(
        inputCustomPayload.trim(),
        isDynamic,
        targetNominal,
        data.refNo,
        info.merchantName || data.merchantName,
        info.nmid || data.nmid,
        info.merchantCity || data.city || 'JAKARTA'
      );

      onChange({
        ...data,
        merchantName: info.merchantName || data.merchantName,
        nmid: info.nmid || data.nmid,
        acquirer: info.acquirerName || data.acquirer,
        city: info.merchantCity || data.city,
        qrisPayload: finalPayload,
      });

      setInputCustomPayload('');
      setShowAdvancedPayload(false);
      if (onNotify) {
        onNotify(`QRIS ${info.merchantName} berhasil dikenali & dihubungkan!`, 'success');
      }
    } catch {
      if (onNotify) onNotify('Format string QRIS tidak valid. Pastikan diawali 000201...', 'error');
    }
  };

  const handleCopyPayload = async () => {
    if (!data.qrisPayload) return;
    try {
      await navigator.clipboard.writeText(data.qrisPayload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      if (onNotify) onNotify('String QRIS tersalin!', 'info');
    } catch {
      // ignore
    }
  };

  const isDinamis = data.qrisType === 'dinamis';

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3.5 no-print">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-black text-rose-700 flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-rose-600" />
          <span>Generator QRIS Dinamis & Statis</span>
        </span>
        <button
          type="button"
          onClick={setWaktuSekarang}
          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          <Clock className="w-3 h-3" />
          <span>Waktu Sekarang</span>
        </button>
      </div>

      {/* ================= BAR GANTI CEPAT AKUN QRIS TOKO (MULTI-MERCHANT) ================= */}
      {savedMerchants.length > 0 && (
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-extrabold text-slate-800">
                Pilih Akun QRIS Toko:
              </span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
                {savedMerchants.length} Akun
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onPrintMerchantStandee && (
                <button
                  type="button"
                  onClick={() => {
                    const current = savedMerchants.find((m) => m.id === activeMerchantId) || savedMerchants[0];
                    if (current) onPrintMerchantStandee(current);
                  }}
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2 py-1 rounded-lg flex items-center gap-1 transition shadow-xs active:scale-95"
                  title="Cetak kartu barcode QRIS akun aktif ke printer thermal"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak Standee QR</span>
                </button>
              )}

              {onOpenSettingsModal && (
                <button
                  type="button"
                  onClick={onOpenSettingsModal}
                  className="text-[10px] bg-white hover:bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg border border-slate-300 flex items-center gap-1 transition"
                  title="Buka menu pengaturan untuk menambah atau mengelola akun QRIS"
                >
                  <Settings className="w-3 h-3 text-slate-500" />
                  <span>Kelola Akun</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {savedMerchants.map((merchant) => {
              const isActive = merchant.id === activeMerchantId;
              return (
                <button
                  key={merchant.id}
                  type="button"
                  onClick={() => onSelectMerchant && onSelectMerchant(merchant)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isActive ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : merchant.isDefault ? (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  ) : (
                    <QrCode className="w-3 h-3 text-slate-400" />
                  )}
                  <span className="uppercase">{merchant.merchantName}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-black uppercase ${
                      isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {merchant.acquirer}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 0. PROFIL QRIS TETAP TOKO (PERMANEN) ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 rounded-xl border border-indigo-500/40 shadow-sm space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">QRIS Tetap Toko</span>
                <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                  Tersimpan Permanen
                </span>
              </div>
              <p className="text-[10px] text-indigo-200 leading-tight">
                Otomatis aktif setiap transaksi tanpa harus memasukkan ulang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleApplyMasterToForm}
              className="text-[10px] bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold px-2 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 transition"
              title="Terapkan QRIS Tetap ini ke form transaksi"
            >
              <RotateCcw className="w-3 h-3 text-indigo-300" />
              <span className="hidden sm:inline">Pakai Tetap</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEditMaster(!showEditMaster)}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black px-2.5 py-1.5 rounded-lg border border-indigo-400/50 flex items-center gap-1 transition shadow-xs"
            >
              <Edit3 className="w-3 h-3" />
              <span>{showEditMaster ? 'Tutup' : 'Ubah QRIS'}</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white/10 rounded-lg p-2 text-[11px] grid grid-cols-2 gap-2 border border-white/10">
          <div>
            <span className="text-indigo-200 text-[10px] block">Merchant:</span>
            <span className="font-extrabold text-white uppercase truncate block">
              {masterQris?.merchantName || data.merchantName || 'KONTER BERKAH'}
            </span>
            <span className="text-indigo-300 text-[10px] block mt-0.5">
              Provider: {masterQris?.acquirer || data.acquirer || 'QRIS NASIONAL'}
            </span>
          </div>
          <div>
            <span className="text-indigo-200 text-[10px] block">NMID Toko:</span>
            <span className="font-mono font-bold text-amber-300 truncate block">
              {masterQris?.nmid || data.nmid || 'ID1020039281921'}
            </span>
            <span className="text-indigo-300 text-[10px] block mt-0.5">
              Kota: {masterQris?.city || data.city || 'JAKARTA'}
            </span>
          </div>
        </div>

        {/* Master Editor Drawer */}
        {showEditMaster && (
          <div className="bg-white text-slate-800 p-3 rounded-xl border border-indigo-200 space-y-2.5 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="font-extrabold text-xs text-indigo-950 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ubah Data QRIS Tetap Toko</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Tersimpan di Penyimpanan HP/Browser</span>
            </div>

            {/* Quick Presets inside Drawer */}
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-1">Pilih Cepat dari Template Bank Toko:</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {SAMPLE_QRIS_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setMasterDraft({
                        merchantName: p.merchantName,
                        nmid: p.nmid,
                        acquirer: p.acquirer,
                        city: p.city,
                        qrisPayload: p.samplePayload,
                        isConfigured: true,
                      });
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 font-bold transition whitespace-nowrap"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600">Nama Merchant Toko</label>
                <input
                  type="text"
                  value={masterDraft.merchantName}
                  onChange={(e) => setMasterDraft({ ...masterDraft, merchantName: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 text-xs font-bold border border-slate-300 rounded uppercase"
                  placeholder="NAMA TOKO"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">NMID Toko</label>
                <input
                  type="text"
                  value={masterDraft.nmid}
                  onChange={(e) => setMasterDraft({ ...masterDraft, nmid: e.target.value })}
                  className="w-full mt-0.5 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded uppercase"
                  placeholder="ID1020039281921"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600">Acquirer / Bank</label>
                <input
                  type="text"
                  value={masterDraft.acquirer}
                  onChange={(e) => setMasterDraft({ ...masterDraft, acquirer: e.target.value.toUpperCase() })}
                  className="w-full mt-0.5 px-2 py-1 text-xs font-bold border border-slate-300 rounded uppercase"
                  placeholder="BCA / DANA / SHOPEEPAY"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Kota Merchant</label>
                <input
                  type="text"
                  value={masterDraft.city}
                  onChange={(e) => setMasterDraft({ ...masterDraft, city: e.target.value.toUpperCase() })}
                  className="w-full mt-0.5 px-2 py-1 text-xs font-bold border border-slate-300 rounded uppercase"
                  placeholder="JAKARTA"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Tempel String QRIS Asli (Opsional - EMVCo Tag 00-63)
              </label>
              <textarea
                rows={2}
                value={masterDraft.qrisPayload}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim().startsWith('000201')) {
                    try {
                      const info = analyzeQrisPayload(val.trim());
                      setMasterDraft({
                        ...masterDraft,
                        qrisPayload: val.trim(),
                        merchantName: info.merchantName || masterDraft.merchantName,
                        nmid: info.nmid || masterDraft.nmid,
                        acquirer: info.acquirerName || masterDraft.acquirer,
                        city: info.merchantCity || masterDraft.city,
                      });
                      return;
                    } catch {}
                  }
                  setMasterDraft({ ...masterDraft, qrisPayload: val });
                }}
                className="w-full mt-0.5 p-1.5 text-[10px] font-mono border border-slate-300 rounded"
                placeholder="00020101021126600014ID.CO.QRIS.WWW..."
              />
            </div>

            <button
              type="button"
              onClick={handleSaveMasterDraft}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs py-2 px-3 rounded-lg shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SIMPAN SEBAGAI QRIS TETAP TOKO (PERMANEN)</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= 1. PILIH TIPE QRIS (DINAMIS / STATIS) ================= */}
      <div>
        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
          Pilih Tipe QRIS:
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {/* OPSI DINAMIS */}
          <button
            type="button"
            onClick={() => handleSelectType('dinamis')}
            className={`flex flex-col items-start p-2.5 rounded-lg text-left transition border ${
              isDinamis
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-black text-xs flex items-center gap-1">
                <Sparkles className={`w-3.5 h-3.5 ${isDinamis ? 'text-amber-300' : 'text-emerald-600'}`} />
                <span>QRIS Dinamis</span>
              </span>
              <span
                className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                  isDinamis ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                NOMINAL PAS
              </span>
            </div>
            <p className={`text-[10px] mt-1 leading-tight ${isDinamis ? 'text-emerald-100' : 'text-slate-500'}`}>
              Input nominal transaksi. Pelanggan scan, nominal langsung muncul di HP tanpa salah ketik.
            </p>
          </button>

          {/* OPSI STATIS */}
          <button
            type="button"
            onClick={() => handleSelectType('statis')}
            className={`flex flex-col items-start p-2.5 rounded-lg text-left transition border ${
              !isDinamis
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-black text-xs flex items-center gap-1">
                <Layers className={`w-3.5 h-3.5 ${!isDinamis ? 'text-rose-200' : 'text-rose-600'}`} />
                <span>QRIS Statis</span>
              </span>
              <span
                className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                  !isDinamis ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'
                }`}
              >
                BEBAS INPUT
              </span>
            </div>
            <p className={`text-[10px] mt-1 leading-tight ${!isDinamis ? 'text-rose-100' : 'text-slate-500'}`}>
              QR standar stiker toko. Pelanggan scan dan mengetikkan nominal sendiri secara manual.
            </p>
          </button>
        </div>
      </div>

      {/* ================= 2. FIELD INPUT NOMINAL TRANSAKSI REAL-TIME (KHUSUS DINAMIS) ================= */}
      {isDinamis ? (
        <div className="bg-emerald-50/90 border-2 border-emerald-400 p-3 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>NOMINAL TRANSAKSI QRIS DINAMIS (Rp)</span>
            </label>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
              Real-Time Sync
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-black text-emerald-700">Rp</span>
            <input
              type="number"
              value={data.nominal || ''}
              onChange={(e) => updateField('nominal', Number(e.target.value) || 0)}
              className="w-full pl-10 pr-3 py-2 text-base font-black text-emerald-950 bg-white border-2 border-emerald-400 rounded-lg shadow-inner focus:outline-emerald-600"
              placeholder="Contoh: 50000"
              autoFocus
            />
          </div>

          {/* Quick Nominal Chips */}
          <div>
            <span className="text-[10px] text-emerald-800 font-bold block mb-1">Pilih Cepat Nominal:</span>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {[10000, 20000, 25000, 50000, 75000, 100000, 150000, 200000, 500000].map((nom) => (
                <button
                  key={nom}
                  type="button"
                  onClick={() => updateField('nominal', nom)}
                  className={`text-[10px] px-2 py-1 rounded-md border font-bold transition whitespace-nowrap active:scale-95 ${
                    data.nominal === nom
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {nom >= 1000000 ? `${nom / 1000000}jt` : `${nom / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Terbilang & Real-time Indicator */}
          <div className="bg-white p-2 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 space-y-0.5">
            <p className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Terbilang: <span className="italic font-medium">{terbilangRupiah(data.total || data.nominal)}</span></span>
            </p>
            <p className="text-[10px] text-emerald-700 leading-tight">
              ⚡ Nominal otomatis disuntikkan ke Tag 54 payload QRIS & struk kasir diperbarui seketika!
            </p>
          </div>
        </div>
      ) : (
        /* KETERANGAN KHUSUS MODE STATIS */
        <div className="bg-amber-50/90 border border-amber-300 p-3 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-950">Mode QRIS Statis Aktif</p>
              <p className="text-[10.5px] text-amber-900 leading-snug mt-0.5">
                Kode QRIS tidak membatasi nominal (Tag 54 dihilangkan). Pelanggan bebas memasukkan nominal sendiri saat scan melalui BCA, BRImo, Livin Mandiri, DANA, GoPay, OVO, ShopeePay.
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-amber-950 block">
              Nominal Referensi Struk Kasir (Opsional)
            </label>
            <input
              type="number"
              value={data.nominal || ''}
              onChange={(e) => updateField('nominal', Number(e.target.value) || 0)}
              className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-amber-300 bg-white rounded-lg focus:outline-amber-600"
              placeholder="0 (atau isi jika ingin mencetak nominal di struk)"
            />
            <p className="text-[9.5px] text-amber-800 mt-1">
              Jika diisi 0, struk akan menampilkan keterangan <i>"Nominal: Sesuai Pembayaran Pelanggan"</i>.
            </p>
          </div>
        </div>
      )}

      {/* BIG PRIMARY BUTTON: OPEN FULLSCREEN CUSTOMER DISPLAY */}
      <button
        type="button"
        onClick={onOpenQrModal}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition tracking-tight"
      >
        <Eye className="w-4 h-4" />
        <span>TAMPILKAN QR DI LAYAR (CUSTOMER SCAN)</span>
      </button>

      {/* Preset Quick Switcher */}
      <div>
        <p className="text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wider">
          Pilih Template Merchant / Provider:
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {SAMPLE_QRIS_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className={`text-[10px] px-2 py-1 rounded-md border font-bold transition whitespace-nowrap ${
                data.acquirer === p.acquirer
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Merchant Name & NMID */}
      <div className="flex justify-between items-center -mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identitas Merchant Toko</span>
        <button
          type="button"
          onClick={handleSaveCurrentAsMaster}
          className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 active:scale-95 font-extrabold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition"
          title="Simpan nama & NMID ini sebagai QRIS Tetap Toko permanen"
        >
          <Save className="w-3 h-3 text-indigo-600" />
          <span>Simpan Jadi QRIS Tetap</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nama Merchant QRIS</label>
          <input
            type="text"
            value={data.merchantName}
            onChange={(e) => updateField('merchantName', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="KONTER BERKAH"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">NMID</label>
          <input
            type="text"
            value={data.nmid}
            onChange={(e) => updateField('nmid', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="ID1020039281921"
          />
        </div>
      </div>

      {/* Row 2: Acquirer & RRN / Ref */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Acquirer / Bank</label>
          <input
            type="text"
            value={data.acquirer}
            onChange={(e) => updateField('acquirer', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="BCA / SHOPEEPAY"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">RRN / No. Ref</label>
          <input
            type="text"
            value={data.refNo}
            onChange={(e) => updateField('refNo', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-medium border border-slate-300 rounded-lg"
            placeholder="QR2026102801"
          />
        </div>
      </div>

      {/* Customer Name */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500">Nama Pelanggan (Opsional)</label>
        <input
          type="text"
          value={data.customerName}
          onChange={(e) => updateField('customerName', e.target.value.toUpperCase())}
          className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
          placeholder="AHMAD FAUZI"
        />
      </div>

      {/* Biaya Layanan & Total */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Biaya Layanan / MDR (Rp)</label>
          <input
            type="number"
            value={data.fee || ''}
            onChange={(e) => updateField('fee', Number(e.target.value) || 0)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[11px] font-black text-rose-950">TOTAL DITERIMA (Rp)</label>
          <div className="mt-1 px-2.5 py-1.5 text-xs font-black text-rose-800 bg-rose-50 border border-rose-300 rounded-lg flex items-center justify-between">
            <span>Total:</span>
            <span>{formatRupiah(data.total || data.nominal)}</span>
          </div>
        </div>
      </div>

      {/* Print QR on Receipt Checkbox */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.printQrOnReceipt}
            onChange={(e) => updateField('printQrOnReceipt', e.target.checked)}
            className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800 block">Cetak Gambar QR Code Asli di Struk Kasir</span>
            <span className="text-[10px] text-slate-500 block">
              Menampilkan gambar barcode QRIS yang dapat di-scan langsung pada kertas struk.
            </span>
          </div>
        </label>
      </div>

      {/* Advanced QRIS String Editor & Scanner Drawer */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedPayload(!showAdvancedPayload)}
          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex justify-between items-center text-xs font-bold text-slate-700 transition"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kustomisasi Payload / Tempel QRIS Toko Sendiri</span>
          </span>
          {showAdvancedPayload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedPayload && (
          <div className="p-3 bg-white space-y-2.5 text-xs border-t border-slate-200 animate-in fade-in">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Punya stiker QRIS resmi dari bank toko Anda? Tempelkan teks payload QRIS Anda di bawah. Aplikasi akan otomatis
              mengubahnya menjadi <b>QRIS Dinamis</b> dengan nominal pas atau <b>QRIS Statis</b>:
            </p>

            <textarea
              rows={3}
              value={inputCustomPayload}
              onChange={(e) => setInputCustomPayload(e.target.value)}
              placeholder="Contoh: 00020101021126600014ID.CO.QRIS.WWW..."
              className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-rose-500"
            />

            <button
              type="button"
              onClick={handleApplyCustomPayload}
              disabled={!inputCustomPayload.trim()}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs py-2 rounded-lg transition"
            >
              Gunakan QRIS Toko Saya
            </button>

            {/* Current Active Raw Payload Preview */}
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500">String QRIS Aktif (EMVCo Tag 00-63):</span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isCopied ? 'Tersalin!' : 'Salin String'}</span>
                </button>
              </div>
              <p className="text-[9px] font-mono bg-slate-50 p-2 rounded border border-slate-200 break-all select-all text-slate-700">
                {data.qrisPayload || 'Belum ada string payload.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
