import React from 'react';
import { TransferData } from '../types';
import { getCurrentIndonesianDateTime, formatRupiah } from '../utils/formatters';
import { Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TransferFormProps {
  data: TransferData;
  onChange: (data: TransferData) => void;
}

const COMMON_BANKS = ['BCA', 'BRI', 'MANDIRI', 'BNI', 'BSI', 'JAGO', 'SEABANK', 'DANA', 'GOPAY', 'OVO', 'SHOPEEPAY'];

export const TransferForm: React.FC<TransferFormProps> = ({ data, onChange }) => {
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

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3 no-print">
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

      {/* Bank Pengirim & Bank Tujuan */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Bank Pengirim</label>
          <input
            type="text"
            value={data.bankPengirim}
            onChange={(e) => updateField('bankPengirim', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="BCA / DANA"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Bank / E-Wallet Tujuan</label>
          <input
            type="text"
            value={data.bankTujuan}
            onChange={(e) => updateField('bankTujuan', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="BRI / GOPAY"
          />
        </div>
      </div>

      {/* Quick Bank Chips */}
      <div>
        <p className="text-[10px] text-slate-400 font-semibold mb-1">Pilih Bank / E-Wallet Cepat:</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
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

      {/* Rekening Pengirim & Sensor Masking */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-slate-600">No. Rekening Asal</label>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={data.sensorRekening}
              onChange={(e) => updateField('sensorRekening', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Sensor Rekening</span>
          </label>
        </div>
        <input
          type="text"
          value={data.rekeningPengirim}
          onChange={(e) => updateField('rekeningPengirim', e.target.value)}
          className="w-full px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-md bg-white"
          placeholder="8291029381 (opsional)"
        />
      </div>

      {/* Rekening Tujuan & Nama Penerima */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">No. Rekening / No. HP Tujuan</label>
          <input
            type="text"
            value={data.rekeningTujuan}
            onChange={(e) => updateField('rekeningTujuan', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-900"
            placeholder="08123456789 / 5412890"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nama Penerima</label>
          <input
            type="text"
            value={data.namaPenerima}
            onChange={(e) => updateField('namaPenerima', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold uppercase border border-slate-300 rounded-lg text-slate-900"
            placeholder="SITI AMINAH"
          />
        </div>
      </div>

      {/* Catatan / Berita */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500">Berita / Catatan Transaksi</label>
        <input
          type="text"
          value={data.catatan}
          onChange={(e) => updateField('catatan', e.target.value)}
          className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
          placeholder="Bayar arisan / titip belanja"
        />
      </div>

      {/* Nominal Transfer */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-slate-600">Nominal Transfer (Rp)</label>
          <div className="flex gap-1 overflow-x-auto">
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
    </div>
  );
};
