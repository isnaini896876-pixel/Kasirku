import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Printer, Volume2, Sparkles, QrCode as QrIcon } from 'lucide-react';
import { QrisData, StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { playChimeSound, announceTransaction } from '../utils/sound';

interface QrisDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QrisData;
  settings: StoreSettings;
  onPrintReceipt: () => void;
}

export const QrisDisplayModal: React.FC<QrisDisplayModalProps> = ({
  isOpen,
  onClose,
  data,
  settings,
  onPrintReceipt,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const payload = data.qrisPayload;
  const isDinamis = data.qrisType === 'dinamis';

  useEffect(() => {
    if (!payload || !isOpen) return;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [payload, isOpen]);

  if (!isOpen) return null;

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playChimeSound();
    } catch {
      // ignore
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = `QRIS-${isDinamis ? 'Dinamis' : 'Statis'}-${(data.merchantName || 'Toko').replace(/\s+/g, '_')}-${Date.now()}.png`;
    a.href = qrDataUrl;
    a.click();
  };

  const handleAnnounce = async () => {
    setIsSpeaking(true);
    await announceTransaction(data.total, 'qris', data.merchantName || settings.storeName);
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs no-print animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Indonesian QRIS Standard Red Header Bar */}
        <div className="bg-[#e11d48] text-white p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#e11d48] font-black px-1.5 py-0.5 rounded text-[11px] tracking-wider">
              QRIS
            </div>
            <div>
              <p className="font-extrabold text-xs tracking-tight leading-none">QR Code Indonesian Standard</p>
              <p className="text-[9px] text-rose-100 mt-0.5">Satu QRIS untuk Semua Pembayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-rose-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant & Mode Banner */}
        <div className="p-3 text-center bg-slate-50 border-b border-slate-200">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
            {data.merchantName || settings.storeName}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono font-semibold">
            NMID: {data.nmid || 'ID1020039281921'}
          </p>

          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isDinamis
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isDinamis ? 'bg-emerald-600' : 'bg-indigo-600'}`} />
              <span>{isDinamis ? 'QRIS DINAMIS (NOMINAL OTOMATIS)' : 'QRIS STATIS (NOMINAL BEBAS)'}</span>
            </span>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="p-4 flex flex-col items-center justify-center bg-white">
          <div className="p-2.5 bg-white border-2 border-slate-900 rounded-2xl shadow-md">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QRIS Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 text-slate-400">
                <QrIcon className="w-12 h-12 animate-pulse text-slate-400" />
              </div>
            )}
          </div>

          {/* Amount Display */}
          {isDinamis ? (
            <div className="mt-3 text-center">
              <span className="text-[11px] font-bold text-slate-500 block">TOTAL YANG HARUS DIBAYAR</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight block">
                {formatRupiah(data.total)}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Nominal terkunci otomatis saat di-scan oleh pelanggan.
              </p>
            </div>
          ) : (
            <div className="mt-3 text-center">
              <span className="text-xs font-bold text-slate-700 block">
                Pelanggan Memasukkan Nominal Manual
              </span>
              <p className="text-[10px] text-slate-500">
                Dapat discan berulang kali untuk nominal berapa pun.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadQr}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[10px] font-bold transition active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600 mb-0.5" />
            <span>Simpan QR</span>
          </button>

          <button
            onClick={handleCopyPayload}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[10px] font-bold transition active:scale-95 shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 mb-0.5" /> : <Copy className="w-4 h-4 text-slate-600 mb-0.5" />}
            <span>{copied ? 'Tersalin' : 'Salin String'}</span>
          </button>

          <button
            onClick={handleAnnounce}
            disabled={isSpeaking}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition active:scale-95 shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-white mb-0.5" />
            <span>Soundbox</span>
          </button>
        </div>

        {/* Print Receipt Button */}
        <div className="p-3 bg-white border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onPrintReceipt();
            }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Transaksi Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
