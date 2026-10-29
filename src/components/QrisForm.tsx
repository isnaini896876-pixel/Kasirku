import React from 'react';
import { QrisData } from '../types';
import { getCurrentIndonesianDateTime, formatRupiah } from '../utils/formatters';
import { Clock, QrCode } from 'lucide-react';

interface QrisFormProps {
  data: QrisData;
  onChange: (data: QrisData) => void;
}

const COMMON_ACQUIRERS = ['BCA', 'SHOPEEPAY', 'GOPAY', 'DANA', 'NOBU', 'NETZME', 'LINKAJA'];

export const QrisForm: React.FC<QrisFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof QrisData, value: any) => {
    const updated = { ...data, [field]: value };
    if (field === 'nominal' || field === 'fee') {
      const nom = field === 'nominal' ? Number(value) || 0 : data.nominal;
      const f = field === 'fee' ? Number(value) || 0 : data.fee;
      updated.total = nom + f;
    }
    onChange(updated);
  };

  const setWaktuSekarang = () => {
    updateField('waktu', getCurrentIndonesianDateTime());
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3 no-print">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-extrabold text-teal-700 flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-teal-600" />
          <span>Data Transaksi QRIS Pay</span>
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

      {/* Row 1: Merchant Name & NMID */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nama Merchant QRIS</label>
          <input
            type="text"
            value={data.merchantName}
            onChange={(e) => updateField('merchantName', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg uppercase"
            placeholder="KASIR UTAMA"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">NMID</label>
          <input
            type="text"
            value={data.nmid}
            onChange={(e) => updateField('nmid', e.target.value)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg uppercase"
            placeholder="ID10200392819"
          />
        </div>
      </div>

      {/* Row 2: Acquirer & RRN */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Acquirer / Provider</label>
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
            placeholder="918203910293"
          />
        </div>
      </div>

      {/* Acquirer Chips */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {COMMON_ACQUIRERS.map((acq) => (
          <button
            key={acq}
            type="button"
            onClick={() => updateField('acquirer', acq)}
            className={`text-[9px] px-2 py-0.5 rounded border font-bold transition whitespace-nowrap ${
              data.acquirer === acq
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {acq}
          </button>
        ))}
      </div>

      {/* Customer Name */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500">Nama Pelanggan / ID Pembeli</label>
        <input
          type="text"
          value={data.customerName}
          onChange={(e) => updateField('customerName', e.target.value.toUpperCase())}
          className="w-full mt-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
          placeholder="AHMAD FAUZI (opsional)"
        />
      </div>

      {/* Nominal Transaksi */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nominal Transaksi (Rp)</label>
          <input
            type="number"
            value={data.nominal || ''}
            onChange={(e) => updateField('nominal', Number(e.target.value) || 0)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-teal-500"
            placeholder="25000"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Biaya Layanan / Admin (Rp)</label>
          <input
            type="number"
            value={data.fee || ''}
            onChange={(e) => updateField('fee', Number(e.target.value) || 0)}
            className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
            placeholder="0"
          />
        </div>
      </div>

      {/* TOTAL BAYAR */}
      <div>
        <label className="text-xs font-black text-slate-800 flex justify-between">
          <span>TOTAL PEMBAYARAN DITERIMA</span>
          <span className="text-[11px] font-bold text-teal-600">{formatRupiah(data.total)}</span>
        </label>
        <input
          type="number"
          value={data.total || ''}
          onChange={(e) => updateField('total', Number(e.target.value) || 0)}
          className="w-full mt-1 px-3 py-2 text-sm font-black text-teal-950 bg-teal-50 border-2 border-teal-300 rounded-lg focus:outline-teal-600"
        />
      </div>
    </div>
  );
};
