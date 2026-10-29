import React, { useRef, useState } from 'react';
import {
  TabType,
  PlnTokenData,
  TransferData,
  QrisData,
  TokoData,
  StoreSettings,
} from '../types';
import { formatRupiah, maskAccount, formatNumberOnly } from '../utils/formatters';
import {
  printViaRawBt,
  buildEscPosReceipt,
  buildWhatsAppTextReceipt,
  printViaBle,
  globalBleState,
} from '../utils/printer';
import { announceTransaction, playChimeSound } from '../utils/sound';
import {
  Smartphone,
  Printer,
  Share2,
  Copy,
  Download,
  Volume2,
  Check,
  ZoomIn,
  ZoomOut,
  Bluetooth,
} from 'lucide-react';

interface ReceiptPreviewProps {
  activeTab: TabType;
  plnData: PlnTokenData;
  transferData: TransferData;
  qrisData: QrisData;
  tokoData: TokoData;
  settings: StoreSettings;
  onRecordHistory: () => void;
  bleConnected: boolean;
  onConnectBlePrompt: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  activeTab,
  plnData,
  transferData,
  qrisData,
  tokoData,
  settings,
  onRecordHistory,
  bleConnected,
  onConnectBlePrompt,
  onNotify,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isPrintingBle, setIsPrintingBle] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'large'>('normal');

  const getData = () => {
    switch (activeTab) {
      case 'token':
        return plnData;
      case 'transfer':
        return transferData;
      case 'qris':
        return qrisData;
      case 'toko':
        return tokoData;
    }
  };

  const currentData = getData();

  const getTotalAmount = () => {
    switch (activeTab) {
      case 'token':
        return plnData.total;
      case 'transfer':
        return transferData.total;
      case 'qris':
        return qrisData.total;
      case 'toko':
        return tokoData.total;
    }
  };

  // 1. RawBT Universal Print
  const handlePrintRawBt = () => {
    const builder = buildEscPosReceipt(activeTab, currentData, settings);
    const base64 = builder.getBase64();
    printViaRawBt(base64);
    onRecordHistory();
    if (onNotify) onNotify('Membuka driver RawBT...', 'info');

    if (settings.autoAnnounceOnPrint && settings.soundEnabled) {
      announceTransaction(getTotalAmount(), activeTab, settings.storeName);
    }
  };

  // 2. Direct Bluetooth BLE Print
  const handlePrintBle = async () => {
    if (!bleConnected || !globalBleState.characteristic) {
      onConnectBlePrompt();
      return;
    }

    try {
      setIsPrintingBle(true);
      const builder = buildEscPosReceipt(activeTab, currentData, settings);
      const bytes = builder.getBytes();
      await printViaBle(bytes);
      onRecordHistory();
      if (onNotify) onNotify('Struk berhasil dikirim ke printer BLE!', 'success');

      if (settings.autoAnnounceOnPrint && settings.soundEnabled) {
        announceTransaction(getTotalAmount(), activeTab, settings.storeName);
      }
    } catch (err: any) {
      const msg = 'Gagal mengirim ke printer BLE: ' + (err.message || 'Koneksi terputus.');
      if (onNotify) onNotify(msg, 'error');
    } finally {
      setIsPrintingBle(false);
    }
  };

  // 3. Web Print (Browser Native / ESC-POS POS driver)
  const handlePrintBrowser = () => {
    window.print();
    onRecordHistory();
    if (settings.autoAnnounceOnPrint && settings.soundEnabled) {
      announceTransaction(getTotalAmount(), activeTab, settings.storeName);
    }
  };

  // 4. WhatsApp Text Copy
  const handleCopyWhatsApp = async () => {
    const text = buildWhatsAppTextReceipt(activeTab, currentData, settings);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
      playChimeSound();
      if (onNotify) onNotify('Teks struk berhasil disalin untuk WhatsApp!', 'success');
    } catch {
      if (onNotify) onNotify('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  // 5. Download Canvas Image
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;

    try {
      const receiptEl = receiptRef.current;
      const width = receiptEl.offsetWidth;
      const height = receiptEl.offsetHeight;

      // Create high-res canvas
      const canvas = document.createElement('canvas');
      const scale = 2; // retina sharp
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Simple SVG foreignObject render
      const dataSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Courier Prime', monospace; background: #ffffff; color: #000000; padding: 16px;">
              ${receiptEl.innerHTML}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([dataSvg], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URLObj.revokeObjectURL(blobURL);

        const a = document.createElement('a');
        a.download = `Struk-${activeTab.toUpperCase()}-${Date.now()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = blobURL;
    } catch (e) {
      console.warn('Canvas download error:', e);
      // Fallback: copy text
      handleCopyWhatsApp();
    }
  };

  // 6. Voice Announcement
  const handleAnnounceVoice = () => {
    announceTransaction(getTotalAmount(), activeTab, settings.storeName);
  };

  const is58mm = settings.paperWidth === '58mm';

  return (
    <div className="space-y-3">
      {/* Receipt Actions Header Bar */}
      <div className="bg-slate-800 text-white p-2.5 rounded-xl shadow-md flex justify-between items-center no-print">
        <div className="flex items-center gap-1.5">
          <Printer className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black">Pratinjau Struk Kasir</span>
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-slate-300">
            {settings.paperWidth}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'large' : 'normal')}
            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-0.5"
            title="Ubah Ukuran Tampilan Teks Struk"
          >
            {zoomLevel === 'normal' ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleAnnounceVoice}
            className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-1 font-bold px-2"
            title="Putar Suara Soundbox Kasir"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Suara</span>
          </button>
        </div>
      </div>

      {/* ================= AUTHENTIC THERMAL PAPER ================= */}
      <div className="flex justify-center my-2">
        <div
          id="printable-receipt"
          ref={receiptRef}
          className={`bg-white text-black border border-slate-300 shadow-md transition-all ${
            is58mm ? 'w-full max-w-[340px]' : 'w-full max-w-[420px]'
          } ${zoomLevel === 'large' ? 'text-sm' : 'text-xs'} p-4 select-text leading-tight`}
          style={{
            fontFamily: "'Courier Prime', 'Space Mono', Courier, monospace",
            position: 'relative',
          }}
        >
          {/* Jagged tear edge effect top & bottom */}
          <div
            className="absolute -top-1.5 left-0 right-0 h-1.5"
            style={{
              background: 'radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)',
              backgroundSize: '10px 10px',
            }}
          />

          {/* STORE HEADER */}
          <div className="text-center space-y-0.5 mb-2">
            <h2 className="font-black text-sm tracking-wide uppercase">{settings.storeName}</h2>
            {settings.tagline && <p className="text-[11px] font-semibold">{settings.tagline}</p>}
            {settings.address && <p className="text-[10px]">{settings.address}</p>}
            {settings.phone && <p className="text-[10px]">Telp/WA: {settings.phone}</p>}
          </div>

          <div className="border-b-2 border-black border-dashed my-1.5" />

          {/* TAB CONTENT: TOKEN PLN */}
          {activeTab === 'token' && (
            <div className="space-y-1">
              <div className="text-center font-bold tracking-tight text-[11px]">
                STRUK PEMBELIAN LISTRIK PRABAYAR
              </div>

              <div className="space-y-0.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>WAKTU</span>
                  <span>{plnData.waktu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>NO. REF/SN</span>
                  <span className="font-mono">{plnData.sn || '-'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>IDPEL/METER</span>
                  <span className="font-mono">{plnData.idpel || '-'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>NAMA</span>
                  <span className="uppercase">{plnData.nama || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>TARIF/DAYA</span>
                  <span>{plnData.tarifDaya || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>JML KWH</span>
                  <span className="font-bold">{plnData.kwh || '-'}</span>
                </div>
              </div>

              {/* JUMBO TOKEN BOX */}
              <div className="my-2 bg-[#fffbeb] border-2 border-dashed border-[#f59e0b] rounded p-2 text-center">
                <span className="text-[11px] font-extrabold text-amber-900 block">
                  STROOM / KODE TOKEN LISTRIK:
                </span>
                <span
                  className="block font-black tracking-wider text-black bg-white border border-[#fde68a] rounded my-1 py-1.5 px-0.5 select-all"
                  style={{
                    fontSize: is58mm ? '17px' : '20px',
                    fontFamily: "'Courier Prime', monospace",
                    letterSpacing: '0.5px',
                  }}
                >
                  {plnData.token || '0000-0000-0000-0000-0000'}
                </span>
                <span className="text-[9px] text-amber-800 font-bold block">
                  (20 DIGIT NOMOR TOKEN METERAN)
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>NOMINAL TOKEN</span>
                  <span>{formatRupiah(plnData.nominal)}</span>
                </div>
                {plnData.statusAdminPln && plnData.adminPln > 0 && (
                  <div className="flex justify-between">
                    <span>ADMIN PLN/BANK</span>
                    <span>{formatRupiah(plnData.adminPln)}</span>
                  </div>
                )}
                {plnData.statusAdminKonter && plnData.adminKonter > 0 && (
                  <div className="flex justify-between">
                    <span>JASA KONTER/TOKO</span>
                    <span>{formatRupiah(plnData.adminKonter)}</span>
                  </div>
                )}
                <div className="border-t border-black my-1" />
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL BAYAR</span>
                  <span>{formatRupiah(plnData.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TRANSFER */}
          {activeTab === 'transfer' && (
            <div className="space-y-1">
              <div className="text-center font-bold tracking-tight text-[11px]">
                BUKTI TRANSFER DANA
              </div>
              <div className="text-center">
                <span className="inline-block bg-black text-white font-black px-2 py-0.5 text-[10px] rounded">
                  {transferData.status || 'BERHASIL'}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>WAKTU</span>
                  <span>{transferData.waktu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>NO. REFERENSI</span>
                  <span className="font-mono">{transferData.refNo || '-'}</span>
                </div>
                <div className="border-t border-dashed border-black my-1" />
                <div className="flex justify-between">
                  <span>SUMBER DANA</span>
                  <span className="font-bold">{transferData.bankPengirim || '-'}</span>
                </div>
                {transferData.rekeningPengirim && (
                  <div className="flex justify-between">
                    <span>NO. REK PENGIRIM</span>
                    <span className="font-mono">
                      {transferData.sensorRekening
                        ? maskAccount(transferData.rekeningPengirim)
                        : transferData.rekeningPengirim}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TUJUAN</span>
                  <span className="font-bold">{transferData.bankTujuan || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>NO. REK/HP</span>
                  <span className="font-mono font-bold">{transferData.rekeningTujuan || '-'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>PENERIMA</span>
                  <span className="uppercase">{transferData.namaPenerima || '-'}</span>
                </div>
                {transferData.catatan && (
                  <div className="flex justify-between text-[10px]">
                    <span>BERITA</span>
                    <span>{transferData.catatan}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>NOMINAL TRF</span>
                  <span>{formatRupiah(transferData.nominal)}</span>
                </div>
                {transferData.statusAdminBank && transferData.adminBank > 0 && (
                  <div className="flex justify-between">
                    <span>ADMIN BANK</span>
                    <span>{formatRupiah(transferData.adminBank)}</span>
                  </div>
                )}
                {transferData.statusAdminKonter && transferData.adminKonter > 0 && (
                  <div className="flex justify-between">
                    <span>BIAYA LAYANAN</span>
                    <span>{formatRupiah(transferData.adminKonter)}</span>
                  </div>
                )}
                <div className="border-t border-black my-1" />
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL BAYAR</span>
                  <span>{formatRupiah(transferData.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: QRIS */}
          {activeTab === 'qris' && (
            <div className="space-y-1">
              <div className="text-center font-bold tracking-tight text-[11px]">
                BUKTI PEMBAYARAN QRIS
              </div>
              <div className="text-center">
                <span className="inline-block bg-black text-white font-black px-2 py-0.5 text-[10px] rounded">
                  {qrisData.status || 'SUKSES DITERIMA'}
                </span>
              </div>

              <div className="space-y-0.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>WAKTU</span>
                  <span>{qrisData.waktu || '-'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>MERCHANT</span>
                  <span className="uppercase">{qrisData.merchantName || settings.storeName}</span>
                </div>
                {qrisData.nmid && (
                  <div className="flex justify-between">
                    <span>NMID</span>
                    <span className="font-mono">{qrisData.nmid}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ACQUIRER</span>
                  <span>{qrisData.acquirer || 'QRIS'}</span>
                </div>
                <div className="flex justify-between">
                  <span>RRN / REF</span>
                  <span className="font-mono">{qrisData.refNo || '-'}</span>
                </div>
                {qrisData.customerName && (
                  <div className="flex justify-between">
                    <span>PELANGGAN</span>
                    <span>{qrisData.customerName}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>NOMINAL</span>
                  <span>{formatRupiah(qrisData.nominal)}</span>
                </div>
                {qrisData.fee > 0 && (
                  <div className="flex justify-between">
                    <span>BIAYA ADMIN</span>
                    <span>{formatRupiah(qrisData.fee)}</span>
                  </div>
                )}
                <div className="border-t border-black my-1" />
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL PEMBAYARAN</span>
                  <span>{formatRupiah(qrisData.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TOKO */}
          {activeTab === 'toko' && (
            <div className="space-y-1">
              <div className="text-center font-bold tracking-tight text-[11px]">
                STRUK PENJUALAN TOKO
              </div>

              <div className="flex justify-between text-[10px]">
                <span>NO: {tokoData.noStruk || 'STRUK-001'}</span>
                <span>{tokoData.waktu || '-'}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>KASIR: {tokoData.kasir || 'Admin'}</span>
                <span>PLG: {tokoData.customerName || 'Umum'}</span>
              </div>

              <div className="border-t border-dashed border-black my-1" />

              {/* Items List */}
              <div className="space-y-1 text-[11px]">
                {tokoData.items.map((item, i) => (
                  <div key={i}>
                    <div className="font-bold">{item.name}</div>
                    <div className="flex justify-between text-[10px] pl-2 text-slate-700">
                      <span>
                        {item.qty} x {formatRupiah(item.price)}
                      </span>
                      <span className="font-bold text-black">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>
                    {formatRupiah(tokoData.items.reduce((acc, c) => acc + c.subtotal, 0))}
                  </span>
                </div>
                {tokoData.diskon > 0 && (
                  <div className="flex justify-between text-rose-800">
                    <span>DISKON</span>
                    <span>-{formatRupiah(tokoData.diskon)}</span>
                  </div>
                )}
                {tokoData.biayaLain > 0 && (
                  <div className="flex justify-between">
                    <span>BIAYA LAIN</span>
                    <span>{formatRupiah(tokoData.biayaLain)}</span>
                  </div>
                )}
                <div className="border-t border-black my-1" />
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL</span>
                  <span>{formatRupiah(tokoData.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>BAYAR (TUNAI)</span>
                  <span>{formatRupiah(tokoData.tunai)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>KEMBALIAN</span>
                  <span>{formatRupiah(tokoData.kembali)}</span>
                </div>
              </div>
            </div>
          )}

          {/* BARCODE / QR SVG VISUALIZATION */}
          {settings.showBarcode && (
            <div className="my-2.5 flex flex-col items-center justify-center">
              <svg className="w-36 h-9 opacity-85" viewBox="0 0 100 24">
                <rect x="0" y="0" width="2" height="24" fill="#000" />
                <rect x="4" y="0" width="1" height="24" fill="#000" />
                <rect x="7" y="0" width="3" height="24" fill="#000" />
                <rect x="12" y="0" width="1" height="24" fill="#000" />
                <rect x="15" y="0" width="4" height="24" fill="#000" />
                <rect x="21" y="0" width="2" height="24" fill="#000" />
                <rect x="25" y="0" width="1" height="24" fill="#000" />
                <rect x="28" y="0" width="3" height="24" fill="#000" />
                <rect x="33" y="0" width="2" height="24" fill="#000" />
                <rect x="37" y="0" width="4" height="24" fill="#000" />
                <rect x="43" y="0" width="1" height="24" fill="#000" />
                <rect x="46" y="0" width="3" height="24" fill="#000" />
                <rect x="51" y="0" width="2" height="24" fill="#000" />
                <rect x="55" y="0" width="4" height="24" fill="#000" />
                <rect x="61" y="0" width="1" height="24" fill="#000" />
                <rect x="64" y="0" width="3" height="24" fill="#000" />
                <rect x="69" y="0" width="2" height="24" fill="#000" />
                <rect x="73" y="0" width="4" height="24" fill="#000" />
                <rect x="79" y="0" width="1" height="24" fill="#000" />
                <rect x="82" y="0" width="3" height="24" fill="#000" />
                <rect x="87" y="0" width="2" height="24" fill="#000" />
                <rect x="91" y="0" width="4" height="24" fill="#000" />
                <rect x="97" y="0" width="2" height="24" fill="#000" />
              </svg>
              <span className="text-[8px] tracking-widest font-mono text-slate-700 mt-0.5">
                VERIFIED TRANSACTION
              </span>
            </div>
          )}

          {/* FOOTER */}
          <div className="border-t-2 border-black border-dashed my-2" />
          <div className="text-center text-[10px] space-y-0.5 text-black">
            <p className="font-semibold">
              {settings.footerMessage || 'Terima kasih atas kunjungan Anda'}
            </p>
            <p className="text-[9px]">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
          </div>

          {/* Jagged bottom edge */}
          <div
            className="absolute -bottom-1.5 left-0 right-0 h-1.5"
            style={{
              background: 'radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)',
              backgroundSize: '10px 10px',
            }}
          />
        </div>
      </div>

      {/* ================= PRINT & SHARE ACTION BUTTONS ================= */}
      <div className="space-y-2 no-print">
        {/* PRIMARY GREEN RAWBT BUTTON */}
        <button
          onClick={handlePrintRawBt}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-sm shadow-md transition tracking-tight"
        >
          <Smartphone className="w-5 h-5" />
          <span>CETAK KE PRINTER THERMAL (RAWBT)</span>
        </button>

        {/* 2ND ROW: BLE & BROWSER */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handlePrintBle}
            disabled={isPrintingBle}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white py-2.5 px-3 rounded-lg font-extrabold text-xs shadow-xs transition"
          >
            <Bluetooth className="w-4 h-4" />
            <span>{isPrintingBle ? 'Mencetak...' : 'Cetak Direct BLE'}</span>
          </button>

          <button
            onClick={handlePrintBrowser}
            className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white py-2.5 px-3 rounded-lg font-extrabold text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Browser / PDF</span>
          </button>
        </div>

        {/* 3RD ROW: WHATSAPP TEXT & DOWNLOAD IMAGE */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 py-2.5 px-3 rounded-lg font-bold text-xs transition active:scale-95"
          >
            {copiedNotice ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedNotice ? 'Tersalin!' : 'Salin Teks WhatsApp'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 px-3 rounded-lg font-bold text-xs transition active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Simpan Gambar PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
