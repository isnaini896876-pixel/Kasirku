import React, { useState, useEffect } from 'react';
import { TransferData, SenderAccountCategory } from '../types';
import { getCurrentIndonesianDateTime, formatRupiah } from '../utils/formatters';
import {
  Clock,
  Send,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  CreditCard,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  User,
  X,
  BookmarkCheck,
} from 'lucide-react';

interface TransferFormProps {
  data: TransferData;
  onChange: (data: TransferData) => void;
}

const COMMON_BANKS = ['BCA', 'BRI', 'MANDIRI', 'BNI', 'BSI', 'JAGO', 'SEABANK', 'DANA', 'GOPAY', 'OVO', 'SHOPEEPAY'];

const DEFAULT_SENDER_CATEGORIES: SenderAccountCategory[] = [
  {
    id: 'cat-bca-utama',
    categoryName: 'Rekening Utama Toko',
    bank: 'BCA',
    accountNumber: '8291029381',
    accountHolder: 'KONTER BERKAH',
  },
  {
    id: 'cat-dana-bisnis',
    categoryName: 'DANA Bisnis Kasir',
    bank: 'DANA',
    accountNumber: '0812-3456-7890',
    accountHolder: 'KONTER PAYMENT',
  },
  {
    id: 'cat-bri-agen',
    categoryName: 'BRI Agen BRILink',
    bank: 'BRI',
    accountNumber: '0021-0103-8291-503',
    accountHolder: 'AGEN BRILINK RESMI',
  },
  {
    id: 'cat-mandiri-kasir',
    categoryName: 'Mandiri Kasir',
    bank: 'MANDIRI',
    accountNumber: '1370-0182-9102-9',
    accountHolder: 'WARUNG CELL',
  },
  {
    id: 'cat-seabank-reload',
    categoryName: 'SeaBank Operasional',
    bank: 'SEABANK',
    accountNumber: '9012-3847-1928',
    accountHolder: 'DIGITAL RELOAD',
  },
];

const BERITA_PRESETS = [
  'Pembayaran Tagihan',
  'Transfer Kasir Toko',
  'Titip Belanja',
  'Top Up Saldo E-Wallet',
  'Pelunasan Barang',
  'Biaya Administrasi',
];

export const TransferForm: React.FC<TransferFormProps> = ({ data, onChange }) => {
  // Saved sender account categories in localStorage
  const [senderCategories, setSenderCategories] = useState<SenderAccountCategory[]>(() => {
    try {
      const saved = localStorage.getItem('kasir_struk_sender_accounts');
      return saved ? JSON.parse(saved) : DEFAULT_SENDER_CATEGORIES;
    } catch {
      return DEFAULT_SENDER_CATEGORIES;
    }
  });

  // Modal / Form state for adding new sender account category
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBank, setNewCatBank] = useState('BCA');
  const [newCatNumber, setNewCatNumber] = useState('');
  const [newCatHolder, setNewCatHolder] = useState('');

  // Persist sender categories
  useEffect(() => {
    try {
      localStorage.setItem('kasir_struk_sender_accounts', JSON.stringify(senderCategories));
    } catch (e) {
      console.warn('Failed saving sender categories:', e);
    }
  }, [senderCategories]);

  const updateField = (field: keyof TransferData, value: any) => {
    const updated = { ...data, [field]: value };

    if (
      field === 'nominal' ||
      field === 'adminBank' ||
      field === 'adminKonter' ||
      field === 'statusAdminBank' ||
      field === 'statusAdminKonter'
    ) {
      const nom = field === 'nominal' ? Number(value) || 0 : data.nominal;
      const admBank = field === 'adminBank' ? Number(value) || 0 : data.adminBank;
      const admKtr = field === 'adminKonter' ? Number(value) || 0 : data.adminKonter;
      const useAdmBank = field === 'statusAdminBank' ? Boolean(value) : data.statusAdminBank;
      const useAdmKtr = field === 'statusAdminKonter' ? Boolean(value) : data.statusAdminKonter;

      updated.total = nom + (useAdmBank ? admBank : 0) + (useAdmKtr ? admKtr : 0);
    }

    onChange(updated);
  };

  const setWaktuSekarang = () => {
    updateField('waktu', getCurrentIndonesianDateTime());
  };

  const handleAdminBankChip = (amount: number) => {
    const updated = {
      ...data,
      adminBank: amount,
      statusAdminBank: true,
      total: data.nominal + amount + (data.statusAdminKonter ? data.adminKonter : 0),
    };
    onChange(updated);
  };

  const handleAdminKonterChip = (amount: number) => {
    const updated = {
      ...data,
      adminKonter: amount,
      statusAdminKonter: true,
      total: data.nominal + (data.statusAdminBank ? data.adminBank : 0) + amount,
    };
    onChange(updated);
  };

  // Select sender account category
  const handleSelectCategory = (cat: SenderAccountCategory) => {
    onChange({
      ...data,
      kategoriPengirim: cat.categoryName,
      bankPengirim: cat.bank,
      rekeningPengirim: cat.accountNumber,
      namaPengirim: cat.accountHolder || data.namaPengirim,
      tampilkanRekeningPengirim: true,
    });
  };

  // Add new sender account category
  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatNumber.trim()) return;

    const newCategory: SenderAccountCategory = {
      id: 'cat-' + Date.now(),
      categoryName: newCatName.trim(),
      bank: (newCatBank || 'BCA').trim().toUpperCase(),
      accountNumber: newCatNumber.trim(),
      accountHolder: newCatHolder.trim() || 'KONTER CELL',
    };

    setSenderCategories((prev) => [newCategory, ...prev]);

    // Automatically apply the new category
    handleSelectCategory(newCategory);

    // Reset and close
    setNewCatName('');
    setNewCatNumber('');
    setNewCatHolder('');
    setShowAddCategoryModal(false);
  };

  const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus kategori rekening pengirim ini?')) {
      setSenderCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Default values guard
  const isSenderVisible = data.tampilkanRekeningPengirim !== false;
  const isNotesVisible = data.tampilkanCatatan !== false;

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3.5 no-print">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-indigo-600" />
          <span>Data Transfer Bank & E-Wallet</span>
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

      {/* Status & No. Ref */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Status Transaksi</label>
          <select
            value={data.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-lg focus:outline-emerald-500"
          >
            <option value="BERHASIL">BERHASIL</option>
            <option value="SUKSES">SUKSES</option>
            <option value="LUNAS">LUNAS</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">No. Referensi / SN</label>
          <input
            type="text"
            value={data.refNo}
            onChange={(e) => updateField('refNo', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-medium border border-slate-300 rounded-lg focus:outline-indigo-500"
            placeholder="TRX20261028001"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEKSI 1: VARIAN REKENING ASAL / PENGIRIM (ON/OFF & KATEGORI) */}
      {/* ========================================================= */}
      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-800">Rekening Asal / Sumber Dana</span>
          </div>

          {/* Toggle Hidup / Matikan Rekening Asal di Struk */}
          <button
            type="button"
            onClick={() => updateField('tampilkanRekeningPengirim', !isSenderVisible)}
            className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full transition shadow-xs ${
              isSenderVisible
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
            }`}
            title="Atur tampilkan atau sembunyikan rekening pengirim pada struk cetak"
          >
            {isSenderVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{isSenderVisible ? 'Tampil di Struk' : 'Mati / Sembunyi'}</span>
          </button>
        </div>

        {/* Categories Chips & Add Button */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Kategori Rekening Pengirim:
            </span>
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {senderCategories.map((cat) => {
              const isSelected =
                data.kategoriPengirim === cat.categoryName ||
                (data.bankPengirim === cat.bank && data.rekeningPengirim === cat.accountNumber);

              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer whitespace-nowrap transition shadow-xs ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.categoryName}</span>
                  <span
                    className={`text-[9px] px-1 rounded ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.bank}
                  </span>
                  {/* Delete button only for non-defaults or any created */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className={`p-0.5 rounded hover:bg-rose-500 hover:text-white transition ${
                      isSelected ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                    title="Hapus Kategori"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Inputs for Sender Account */}
        <div className={`space-y-2 transition-opacity ${!isSenderVisible ? 'opacity-60' : 'opacity-100'}`}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-600">Bank / E-Wallet Pengirim</label>
              <input
                type="text"
                value={data.bankPengirim}
                onChange={(e) => updateField('bankPengirim', e.target.value.toUpperCase())}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase bg-white focus:outline-indigo-500"
                placeholder="BCA / DANA"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-semibold text-slate-600">No. Rekening Asal</label>
                <label className="flex items-center gap-1 text-[9px] font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.sensorRekening}
                    onChange={(e) => updateField('sensorRekening', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 scale-90"
                  />
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Sensor</span>
                </label>
              </div>
              <input
                type="text"
                value={data.rekeningPengirim}
                onChange={(e) => updateField('rekeningPengirim', e.target.value)}
                className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-indigo-500"
                placeholder="8291029381 (opsional)"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600">Nama Pengirim / Pemilik Rekening</label>
            <input
              type="text"
              value={data.namaPengirim || ''}
              onChange={(e) => updateField('namaPengirim', e.target.value.toUpperCase())}
              className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold uppercase border border-slate-300 rounded-lg bg-white focus:outline-indigo-500"
              placeholder="KONTER BERKAH PAYMENT"
            />
          </div>

          {!isSenderVisible && (
            <p className="text-[10px] text-amber-700 italic bg-amber-50 p-1.5 rounded border border-amber-200">
              ℹ️ Rekening asal disetel <b>NONAKTIF</b>: Sumber dana / No. Rekening pengirim tidak akan dicetak di struk.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEKSI 2: DATA REKENING TUJUAN & PENERIMA */}
      {/* ========================================================= */}
      <div className="space-y-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Bank / E-Wallet Tujuan</label>
          <input
            type="text"
            value={data.bankTujuan}
            onChange={(e) => updateField('bankTujuan', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase focus:outline-indigo-500"
            placeholder="BRI / GOPAY / DANA"
          />
        </div>

        {/* Quick Bank Chips */}
        <div>
          <p className="text-[10px] text-slate-400 font-semibold mb-1">Pilih Bank / E-Wallet Cepat:</p>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {COMMON_BANKS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateField('bankTujuan', b)}
                className={`text-[9px] px-2 py-0.5 rounded border font-bold transition whitespace-nowrap ${
                  data.bankTujuan === b
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">No. Rekening / No. HP Tujuan</label>
            <input
              type="text"
              value={data.rekeningTujuan}
              onChange={(e) => updateField('rekeningTujuan', e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-900 focus:outline-indigo-500"
              placeholder="08123456789 / 5412890"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Nama Penerima</label>
            <input
              type="text"
              value={data.namaPenerima}
              onChange={(e) => updateField('namaPenerima', e.target.value.toUpperCase())}
              className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold uppercase border border-slate-300 rounded-lg text-slate-900 focus:outline-indigo-500"
              placeholder="SITI AMINAH"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEKSI 3: TULISAN BERITA OPSIONAL (ON/OFF & VARIAN PRESET) */}
      {/* ========================================================= */}
      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <label className="text-xs font-extrabold text-slate-800">Tulisan Berita / Catatan Transaksi</label>
          </div>

          {/* Toggle Hidup / Matikan Berita di Struk */}
          <button
            type="button"
            onClick={() => updateField('tampilkanCatatan', !isNotesVisible)}
            className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full transition shadow-xs ${
              isNotesVisible
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
            }`}
            title="Aktifkan atau matikan tulisan berita pada struk cetak"
          >
            <span>{isNotesVisible ? 'Berita Aktif' : 'Mati / Nonaktif'}</span>
          </button>
        </div>

        {/* Varian Preset Berita Cepat */}
        {isNotesVisible && (
          <div>
            <p className="text-[10px] text-slate-500 font-semibold mb-1">Varian Berita Cepat:</p>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {BERITA_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateField('catatan', preset)}
                  className={`text-[9px] px-2 py-0.5 rounded border font-semibold whitespace-nowrap transition ${
                    data.catatan === preset
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          value={data.catatan}
          onChange={(e) => updateField('catatan', e.target.value)}
          disabled={!isNotesVisible}
          className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition ${
            isNotesVisible
              ? 'border-slate-300 bg-white text-slate-800 focus:outline-indigo-500'
              : 'border-slate-200 bg-slate-200/60 text-slate-400 cursor-not-allowed'
          }`}
          placeholder={isNotesVisible ? 'Contoh: Bayar arisan / titip belanja' : 'Berita dinonaktifkan (tidak dicetak di struk)'}
        />

        {!isNotesVisible && (
          <p className="text-[10px] text-slate-500 italic">
            ℹ️ Tulisan berita dinonaktifkan: Baris berita tidak akan dicetak di struk kasir.
          </p>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEKSI 4: NOMINAL & ADMIN BIAYA */}
      {/* ========================================================= */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-slate-600">Nominal Transfer (Rp)</label>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {[50000, 100000, 250000, 500000, 1000000].map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => updateField('nominal', nom)}
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold transition ${
                  data.nominal === nom
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {nom >= 1000000 ? `${nom / 1000000}jt` : `${nom / 1000}k`}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          value={data.nominal || ''}
          onChange={(e) => updateField('nominal', Number(e.target.value) || 0)}
          className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-indigo-500"
          placeholder="100000"
        />
      </div>

      {/* ADMIN & JASA KONTER */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
        {/* Biaya Admin Bank */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-slate-700">Admin Bank / BI-Fast:</label>
              <button
                type="button"
                onClick={() => updateField('statusAdminBank', !data.statusAdminBank)}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition ${
                  data.statusAdminBank ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {data.statusAdminBank ? 'Aktif' : 'Off'}
              </button>
            </div>
            <div className="flex gap-1">
              {[0, 2500, 6500].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  onClick={() => handleAdminBankChip(fee)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                    data.adminBank === fee && data.statusAdminBank
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {fee === 0 ? '0' : fee === 2500 ? '2.5k (BI-Fast)' : '6.5k'}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            value={data.adminBank || ''}
            onChange={(e) => updateField('adminBank', Number(e.target.value) || 0)}
            disabled={!data.statusAdminBank}
            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md disabled:bg-slate-200 font-semibold"
          />
        </div>

        {/* Jasa Konter */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-extrabold text-indigo-700">Jasa Konter / Toko:</label>
              <button
                type="button"
                onClick={() => updateField('statusAdminKonter', !data.statusAdminKonter)}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition ${
                  data.statusAdminKonter ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {data.statusAdminKonter ? 'Aktif' : 'Off'}
              </button>
            </div>
            <div className="flex gap-1">
              {[2000, 3000, 5000].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  onClick={() => handleAdminKonterChip(fee)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    data.adminKonter === fee && data.statusAdminKonter
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {fee / 1000}k
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            value={data.adminKonter || ''}
            onChange={(e) => updateField('adminKonter', Number(e.target.value) || 0)}
            disabled={!data.statusAdminKonter}
            className="w-full px-2.5 py-1 text-xs border border-indigo-200 bg-indigo-50/50 rounded-md disabled:bg-slate-200 font-bold text-indigo-900"
          />
        </div>
      </div>

      {/* TOTAL BAYAR */}
      <div>
        <label className="text-xs font-black text-slate-800 flex justify-between">
          <span>TOTAL BAYAR DARI PELANGGAN</span>
          <span className="text-[11px] font-bold text-indigo-600">{formatRupiah(data.total)}</span>
        </label>
        <input
          type="number"
          value={data.total || ''}
          onChange={(e) => updateField('total', Number(e.target.value) || 0)}
          className="w-full mt-1 px-3 py-2 text-sm font-black text-indigo-950 bg-indigo-50/70 border-2 border-indigo-300 rounded-lg focus:outline-indigo-600"
        />
      </div>

      {/* MODAL TAMBAH KATEGORI REKENING PENGIRIM BARU */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Tambah Kategori Rekening</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Kategori / Label Akun</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Contoh: BCA Kasir 2 / BRI Agen Utama"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Bank / E-Wallet</label>
                  <input
                    type="text"
                    required
                    value={newCatBank}
                    onChange={(e) => setNewCatBank(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg uppercase font-bold"
                    placeholder="BCA / BRI / DANA"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">No. Rekening / HP</label>
                  <input
                    type="text"
                    required
                    value={newCatNumber}
                    onChange={(e) => setNewCatNumber(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 font-mono border border-slate-300 rounded-lg"
                    placeholder="8291029381"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Nama Pemilik Rekening (Opsional)</label>
                <input
                  type="text"
                  value={newCatHolder}
                  onChange={(e) => setNewCatHolder(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-2.5 py-1.5 uppercase border border-slate-300 rounded-lg"
                  placeholder="KONTER BERKAH"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
