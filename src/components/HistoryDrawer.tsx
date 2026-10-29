import React, { useState } from 'react';
import { X, Search, Trash2, ArrowUpRight, Download, FileText, Zap, Send, QrCode, ShoppingBag } from 'lucide-react';
import { ReceiptHistoryItem, TabType } from '../types';
import { formatRupiah } from '../utils/formatters';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReceiptHistoryItem[];
  onLoadItem: (item: ReceiptHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onLoadItem,
  onDeleteItem,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesCategory = filterType === 'all' || item.category === filterType;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.customer.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const totalOmzet = history.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const getCategoryBadge = (cat: TabType) => {
    switch (cat) {
      case 'token':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
            <span>TOKEN PLN</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <Send className="w-2.5 h-2.5 text-indigo-600" />
            <span>TRANSFER</span>
          </span>
        );
      case 'qris':
        return (
          <span className="bg-teal-100 text-teal-900 border border-teal-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <QrCode className="w-2.5 h-2.5 text-teal-600" />
            <span>QRIS</span>
          </span>
        );
      case 'toko':
        return (
          <span className="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <ShoppingBag className="w-2.5 h-2.5 text-blue-600" />
            <span>TOKO</span>
          </span>
        );
    }
  };

  const exportCsv = () => {
    if (history.length === 0) return;

    const headers = ['ID', 'Waktu', 'Kategori', 'Keterangan', 'Pelanggan/ID', 'Nominal', 'Total Bayar'];
    const rows = history.map((h) => [
      h.id,
      h.timestamp,
      h.category.toUpperCase(),
      `"${h.title.replace(/"/g, '""')}"`,
      `"${h.customer.replace(/"/g, '""')}"`,
      h.nominal,
      h.total,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan-Kasir-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Riwayat Cetak Struk</h3>
              <p className="text-[10px] text-slate-500">
                {history.length} Transaksi tersimpan | Total: {formatRupiah(totalOmzet)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi, nama pelanggan, IDPEL..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-indigo-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto text-[10px] font-bold">
            {['all', 'token', 'transfer', 'qris', 'toko'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {type === 'all' ? 'Semua' : type}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Belum ada riwayat transaksi yang cocok.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition"
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5">
                    {getCategoryBadge(item.category)}
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Pelanggan: <span className="font-semibold text-slate-700">{item.customer || 'Umum'}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-indigo-700">{formatRupiah(item.total)}</p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <button
                      onClick={() => {
                        onLoadItem(item);
                        onClose();
                      }}
                      className="flex items-center gap-0.5 text-[10px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded transition"
                      title="Buka kembali di form struk"
                    >
                      <span>Buka</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Hapus dari riwayat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 disabled:opacity-40"
          >
            Hapus Semua
          </button>

          <button
            onClick={exportCsv}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
