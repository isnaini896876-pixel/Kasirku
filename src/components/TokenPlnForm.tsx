import React from 'react';
import { PlnTokenData } from '../types';
import { formatToken20, getCurrentIndonesianDateTime, formatRupiah } from '../utils/formatters';
import { Clock, Zap, RefreshCw } from 'lucide-react';

interface TokenPlnFormProps {
  data: PlnTokenData;
  onChange: (data: PlnTokenData) => void;
}

export const TokenPlnForm: React.FC<TokenPlnFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof PlnTokenData, value: any) => {
    const updated = { ...data, [field]: value };

    // Auto recalculate total when nominal or fees change
    if (
      field === 'nominal' ||
      field === 'adminPln' ||
      field === 'adminKonter' ||
      field === 'statusAdminPln' ||
      field === 'statusAdminKonter'
    ) {
      const nom = field === 'nominal' ? Number(value) || 0 : data.nominal;
      const admPln = field === 'adminPln' ? Number(value) || 0 : data.adminPln;
      const admKtr = field === 'adminKonter' ? Number(value) || 0 : data.adminKonter;
      const useAdmPln = field === 'statusAdminPln' ? Boolean(value) : data.statusAdminPln;
      const useAdmKtr = field === 'statusAdminKonter' ? Boolean(value) : data.statusAdminKonter;

      updated.total = nom + (useAdmPln ? admPln : 0) + (useAdmKtr ? admKtr : 0);
    }

    onChange(updated);
  };

  const setWaktuSekarang = () => {
    updateField('waktu', getCurrentIndonesianDateTime());
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatToken20(e.target.value);
    updateField('token', formatted);
  };

  const handleNominalChip = (amount: number) => {
    updateField('nominal', amount);
  };

  const handleAdminPlnChip = (amount: number) => {
    const updated = {
      ...data,
      adminPln: amount,
      statusAdminPln: true,
      total: data.nominal + amount + (data.statusAdminKonter ? data.adminKonter : 0),
    };
    onChange(updated);
  };

  const handleAdminKonterChip = (amount: number) => {
    const updated = {
      ...data,
      adminKonter: amount,
      statusAdminKonter: true,
      total: data.nominal + (data.statusAdminPln ? data.adminPln : 0) + amount,
    };
    onChange(updated);
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3 no-print">
      {/* Form Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Data Token Listrik Prabayar</span>
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

      {/* Row 1: Waktu & No. Ref */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Waktu Transaksi</label>
          <input
            type="text"
            value={data.waktu}
            onChange={(e) => updateField('waktu', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono"
            placeholder="DD/MM/YYYY HH:mm:ss"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">No. Ref / SN</label>
          <input
            type="text"
            value={data.sn}
            onChange={(e) => updateField('sn', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono font-medium"
            placeholder="09283719283910"
          />
        </div>
      </div>

      {/* Row 2: IDPEL & Nama Pelanggan */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">IDPEL / No. Meter</label>
          <input
            type="text"
            value={data.idpel}
            onChange={(e) => updateField('idpel', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500 font-mono font-bold tracking-wider text-slate-900"
            placeholder="54128903211"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nama Pelanggan</label>
          <input
            type="text"
            value={data.nama}
            onChange={(e) => updateField('nama', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500 font-bold uppercase text-slate-900"
            placeholder="BUDI SANTOSO"
          />
        </div>
      </div>

      {/* Row 3: Tarif/Daya & kWh */}
      <div className="grid grid-cols-2 gap-2 bg-amber-50/70 p-2 rounded-lg border border-amber-200/70">
        <div>
          <label className="text-[11px] font-bold text-amber-900">Tarif / Daya</label>
          <input
            type="text"
            value={data.tarifDaya}
            onChange={(e) => updateField('tarifDaya', e.target.value.toUpperCase())}
            className="w-full mt-1 px-2.5 py-1 text-xs border border-amber-300 bg-white rounded-md font-bold text-slate-900"
            placeholder="R1M / 900 VA"
          />
          <div className="flex gap-1 mt-1">
            {['R1M/900 VA', 'R1/1300 VA', 'R1/2200 VA'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateField('tarifDaya', preset)}
                className="text-[9px] bg-white text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100 font-semibold"
              >
                {preset.split('/')[1] || preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-amber-900">Jumlah kWh</label>
          <input
            type="text"
            value={data.kwh}
            onChange={(e) => updateField('kwh', e.target.value)}
            className="w-full mt-1 px-2.5 py-1 text-xs border border-amber-300 bg-white rounded-md font-bold text-slate-900"
            placeholder="33.1 kWh"
          />
        </div>
      </div>

      {/* KOTAK NOMOR TOKEN LISTRIK (JUMBO & PEMISAH RAPAT) */}
      <div className="bg-amber-50/90 border-2 border-dashed border-amber-400 p-2.5 rounded-xl">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-black text-amber-900 tracking-tight">
            KODE TOKEN LISTRIK (20 DIGIT)
          </label>
          <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
            JUMBO & RAPAT
          </span>
        </div>
        <input
          type="text"
          value={data.token}
          onChange={handleTokenChange}
          maxLength={24}
          placeholder="2819-8392-1092-8492-1289"
          className="w-full py-2 px-1 text-center font-mono font-black text-lg tracking-wider text-slate-950 bg-white border-2 border-amber-300 rounded-lg shadow-inner focus:outline-amber-600"
        />
        <p className="text-[10px] text-amber-800 text-center mt-1 font-medium">
          Format otomatis 4-4-4-4-4. Dicetak ekstra besar agar pelanggan mudah memasukkan ke meteran.
        </p>
      </div>

      {/* Nominal Pembelian */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-slate-600">Nominal Pembelian (Rp)</label>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {[20000, 50000, 100000, 200000, 500000].map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => handleNominalChip(nom)}
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold transition ${
                  data.nominal === nom
                    ? 'bg-amber-600 text-white border-amber-600'
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
          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-500 font-bold"
          placeholder="50000"
        />
      </div>

      {/* ADMIN PLN & ADMIN KONTER */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2.5">
        {/* Admin PLN / Bank */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-bold text-slate-700">Admin PLN / Bank:</label>
              <button
                type="button"
                onClick={() => updateField('statusAdminPln', !data.statusAdminPln)}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full transition ${
                  data.statusAdminPln ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {data.statusAdminPln ? 'Aktif' : 'Off'}
              </button>
            </div>
            <div className="flex gap-1">
              {[0, 2500, 3000, 3500].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  onClick={() => handleAdminPlnChip(fee)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                    data.adminPln === fee && data.statusAdminPln
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {fee === 0 ? '0' : `${fee / 1000}k`}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            value={data.adminPln || ''}
            onChange={(e) => updateField('adminPln', Number(e.target.value) || 0)}
            disabled={!data.statusAdminPln}
            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md disabled:bg-slate-200 font-semibold"
          />
        </div>

        {/* Jasa Konter / Toko */}
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
              {[1000, 2000, 2500, 3000].map((fee) => (
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
          <span>TOTAL BAYAR (Rp)</span>
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
