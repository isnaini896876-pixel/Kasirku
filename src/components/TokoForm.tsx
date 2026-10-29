import React, { useState } from 'react';
import { TokoData, CartItem } from '../types';
import { getCurrentIndonesianDateTime, formatRupiah } from '../utils/formatters';
import { Clock, Plus, Trash2, ShoppingBag, Volume2, Coins } from 'lucide-react';
import { announceTransaction } from '../utils/sound';

interface TokoFormProps {
  data: TokoData;
  onChange: (data: TokoData) => void;
  storeName: string;
}

const QUICK_PRODUCTS = [
  { name: 'Pulsa 10.000', price: 12000 },
  { name: 'Pulsa 25.000', price: 27000 },
  { name: 'Paket Data 5GB', price: 35000 },
  { name: 'Kopi Seduh Panas', price: 4000 },
  { name: 'Es Teh Manis', price: 3000 },
  { name: 'Rokok Surya 16', price: 36000 },
  { name: 'Mie Instan Goreng', price: 3500 },
  { name: 'Minyak Goreng 1L', price: 17500 },
];

export const TokoForm: React.FC<TokoFormProps> = ({ data, onChange, storeName }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const calculateTotals = (items: CartItem[], diskon: number, biayaLain: number, tunai: number) => {
    const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total = Math.max(0, subtotal - diskon + biayaLain);
    const kembali = Math.max(0, tunai - total);
    return { total, kembali };
  };

  const updateItems = (newItems: CartItem[]) => {
    const { total, kembali } = calculateTotals(newItems, data.diskon, data.biayaLain, data.tunai);
    onChange({
      ...data,
      items: newItems,
      total,
      kembali,
    });
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) <= 0) return;

    const item: CartItem = {
      id: 'item_' + Date.now(),
      name: newItemName.trim(),
      price: Number(newItemPrice),
      qty: newItemQty || 1,
      subtotal: Number(newItemPrice) * (newItemQty || 1),
    };

    updateItems([...data.items, item]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty(1);
  };

  const handleAddQuickProduct = (p: { name: string; price: number }) => {
    // Check if item already in cart
    const existingIndex = data.items.findIndex((i) => i.name.toLowerCase() === p.name.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...data.items];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].price;
      updateItems(updated);
    } else {
      const item: CartItem = {
        id: 'item_' + Date.now() + Math.random(),
        name: p.name,
        price: p.price,
        qty: 1,
        subtotal: p.price,
      };
      updateItems([...data.items, item]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...data.items];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      handleDeleteItem(index);
      return;
    }
    updated[index].qty = newQty;
    updated[index].subtotal = newQty * updated[index].price;
    updateItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = data.items.filter((_, i) => i !== index);
    updateItems(updated);
  };

  const handleDiskonChange = (val: number) => {
    const { total, kembali } = calculateTotals(data.items, val, data.biayaLain, data.tunai);
    onChange({ ...data, diskon: val, total, kembali });
  };

  const handleTunaiChange = (val: number) => {
    const kembali = Math.max(0, val - data.total);
    onChange({ ...data, tunai: val, kembali });
  };

  const handleQuickCash = (amount: number) => {
    handleTunaiChange(amount);
  };

  const handleVoiceAnnouncement = async () => {
    setIsAnnouncing(true);
    await announceTransaction(data.total, 'toko', storeName);
    setIsAnnouncing(false);
  };

  const setWaktuSekarang = () => {
    onChange({ ...data, waktu: getCurrentIndonesianDateTime() });
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-3.5 space-y-3 no-print">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          <span>Kasir Toko Retail & Suara</span>
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

      {/* Row: No Struk, Kasir & Pelanggan */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">No. Struk</label>
          <input
            type="text"
            value={data.noStruk}
            onChange={(e) => onChange({ ...data, noStruk: e.target.value })}
            className="w-full mt-1 px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Nama Kasir</label>
          <input
            type="text"
            value={data.kasir}
            onChange={(e) => onChange({ ...data, kasir: e.target.value })}
            className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Pelanggan</label>
          <input
            type="text"
            value={data.customerName}
            onChange={(e) => onChange({ ...data, customerName: e.target.value })}
            className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
            placeholder="Umum"
          />
        </div>
      </div>

      {/* Quick Add Product Chips */}
      <div>
        <p className="text-[10px] text-slate-400 font-bold mb-1">Tambah Cepat Produk:</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {QUICK_PRODUCTS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleAddQuickProduct(p)}
              className="text-[10px] px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold transition whitespace-nowrap active:scale-95"
            >
              + {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Item Row */}
      <form onSubmit={handleAddItem} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex gap-1.5 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500">Nama Barang / Jasa</label>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Nama barang..."
            className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] font-bold text-slate-500">Harga (Rp)</label>
          <input
            type="number"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value ? Number(e.target.value) : '')}
            placeholder="15000"
            className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold"
          />
        </div>
        <div className="w-14">
          <label className="text-[10px] font-bold text-slate-500">Qty</label>
          <input
            type="number"
            min={1}
            value={newItemQty}
            onChange={(e) => setNewItemQty(Number(e.target.value) || 1)}
            className="w-full mt-0.5 px-1 py-1 text-xs border border-slate-300 rounded bg-white text-center font-bold"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md transition font-bold"
          title="Tambah ke Keranjang"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Cart Items List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-600 grid grid-cols-12">
          <span className="col-span-6">ITEM</span>
          <span className="col-span-3 text-center">QTY</span>
          <span className="col-span-3 text-right">TOTAL</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
          {data.items.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">Keranjang masih kosong.</div>
          ) : (
            data.items.map((item, idx) => (
              <div key={item.id || idx} className="p-2 text-xs grid grid-cols-12 items-center hover:bg-slate-50/80">
                <div className="col-span-6 truncate pr-1">
                  <p className="font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{formatRupiah(item.price)}</p>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, -1)}
                    className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-xs w-4 text-center">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, 1)}
                    className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-1">
                  <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Diskon & Biaya Tambahan */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Diskon / Potongan (Rp)</label>
          <input
            type="number"
            value={data.diskon || ''}
            onChange={(e) => handleDiskonChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500">Biaya Lain / Admin (Rp)</label>
          <input
            type="number"
            value={data.biayaLain || ''}
            onChange={(e) => {
              const b = Number(e.target.value) || 0;
              const { total, kembali } = calculateTotals(data.items, data.diskon, b, data.tunai);
              onChange({ ...data, biayaLain: b, total, kembali });
            }}
            placeholder="0"
            className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md"
          />
        </div>
      </div>

      {/* TOTAL & BAYAR / KEMBALIAN */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-blue-950">TOTAL BELANJA</span>
          <span className="text-base font-black text-blue-900">{formatRupiah(data.total)}</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-extrabold text-blue-900">UANG DITERIMA (TUNAI)</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleQuickCash(data.total)}
                className="text-[10px] bg-white border border-blue-300 text-blue-800 font-bold px-1.5 py-0.5 rounded shadow-xs"
              >
                Uang Pas
              </button>
              {[50000, 100000, 200000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="text-[10px] bg-white border border-blue-300 text-blue-800 font-bold px-1.5 py-0.5 rounded shadow-xs"
                >
                  {amt / 1000}k
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            value={data.tunai || ''}
            onChange={(e) => handleTunaiChange(Number(e.target.value) || 0)}
            className="w-full px-3 py-1.5 text-sm font-black border border-blue-300 rounded-lg bg-white"
            placeholder="Contoh: 100000"
          />
        </div>

        <div className="flex justify-between items-center border-t border-blue-200/80 pt-2">
          <span className="text-xs font-bold text-slate-700">KEMBALIAN:</span>
          <span className={`text-sm font-black ${data.kembali >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatRupiah(data.kembali)}
          </span>
        </div>
      </div>

      {/* Voice Announcement Button (Soundbox) */}
      <button
        type="button"
        onClick={handleVoiceAnnouncement}
        disabled={isAnnouncing}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-white text-xs font-extrabold py-2.5 px-3 rounded-lg shadow-sm transition"
      >
        <Volume2 className={`w-4 h-4 ${isAnnouncing ? 'animate-bounce' : ''}`} />
        <span>{isAnnouncing ? 'Mengumumkan Suara...' : 'Umumkan Pembayaran Suara (Soundbox)'}</span>
      </button>
    </div>
  );
};
