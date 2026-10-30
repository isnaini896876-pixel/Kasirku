import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Clipboard, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Image as ImageIcon, X, Play, Share2 } from 'lucide-react';
import { parseLocalReceiptText } from '../utils/ocrFallback';
import { TabType } from '../types';

interface ScreenshotScanBoxProps {
  onScanComplete: (data: any, targetTab?: TabType) => void;
  onOpenShareGuide?: () => void;
  externalFileToProcess?: File | null;
  onClearExternalFile?: () => void;
}

// Compress and resize large screenshot images in-browser before upload (max width 1280px, ~150KB JPEG)
function compressImage(file: File, maxWidth = 1280, quality = 0.85): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: img.src, mimeType: file.type || 'image/jpeg' });
          return;
        }

        // Fill white background first so transparent PNG screenshots do not become blacked out
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve({ base64: compressedBase64, mimeType });
      };
      img.onerror = () => reject(new Error('Gagal merender file gambar.'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  });
}

// Sample presets for 1-click testing
const DEMO_PRESETS = [
  {
    label: '⚡ Contoh Token PLN',
    category: 'token' as TabType,
    data: {
      category: 'token',
      waktu: '29/10/2026 10:45:00',
      refNo: 'PLN88192839101',
      idpel: '54128903211',
      namaPelanggan: 'BUDI SANTOSO',
      tarifDaya: 'R1M/900 VA',
      kwh: '33.1 kWh',
      tokenNumber: '4829-1092-8391-0021-9382',
      nominal: 50000,
      adminBank: 3000,
      adminKonter: 2000,
      total: 55000,
    },
  },
  {
    label: '🏦 Contoh Transfer BCA/BRI',
    category: 'transfer' as TabType,
    data: {
      category: 'transfer',
      waktu: '29/10/2026 10:48:15',
      refNo: 'TRX99281029',
      bankPengirim: 'BCA',
      bankTujuan: 'BRI',
      rekeningTujuan: '002101038291503',
      namaPenerima: 'SITI AMINAH',
      nominal: 150000,
      adminBank: 2500,
      adminKonter: 2500,
      total: 155000,
      status: 'BERHASIL',
      catatan: 'Pelunasan tagihan warung',
    },
  },
  {
    label: '💳 Contoh Bukti QRIS',
    category: 'qris' as TabType,
    data: {
      category: 'qris',
      waktu: '29/10/2026 10:50:30',
      refNo: 'QRIS7729104',
      merchantName: 'WARUNG BERKAH JAYA',
      nmid: 'ID1020039281902',
      acquirer: 'BCA QRIS',
      customerName: 'HENDRA KURNIAWAN',
      nominal: 75000,
      adminBank: 0,
      total: 75000,
    },
  },
];

export const ScreenshotScanBox: React.FC<ScreenshotScanBoxProps> = ({
  onScanComplete,
  onOpenShareGuide,
  externalFileToProcess,
  onClearExternalFile,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResultNotice, setScanResultNotice] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process an image file
  const processImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanResultNotice({ message: 'File yang diunggah harus berupa gambar (JPG, PNG, WebP).', isError: true });
      return;
    }

    setIsScanning(true);
    setStatusMessage('Mengompresi & menyiapkan gambar...');
    setScanResultNotice(null);

    try {
      // 1. Client-side compression
      const { base64, mimeType } = await compressImage(file);
      setPreviewUrl(base64);

      setStatusMessage('Menganalisis teks bukti transaksi dengan AI Vision...');

      // 2. Call server-side OCR endpoint
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const data = resJson.data;
        const category: TabType = (data.category as TabType) || 'token';
        onScanComplete(data, category);
        setScanResultNotice({
          message: `Berhasil membaca bukti ${category.toUpperCase()}! Data langsung diisikan ke form.`,
          isError: false,
        });
      } else {
        throw new Error('Format respon AI tidak valid.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanResultNotice({
        message: err?.message || 'Gagal menganalisis gambar. Silakan gunakan opsi Tempel Teks.',
        isError: true,
      });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onScanComplete]);

  // Handle global paste event (Ctrl+V anywhere in document or in input)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  // Handle image received from external share target
  useEffect(() => {
    if (externalFileToProcess) {
      processImageFile(externalFileToProcess);
      onClearExternalFile?.();
    }
  }, [externalFileToProcess, processImageFile, onClearExternalFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleManualTextExtract = async () => {
    if (!pasteText.trim()) return;

    setIsScanning(true);
    setStatusMessage('Menganalisis teks transaksi...');
    setScanResultNotice(null);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          const data = res.data;
          const category: TabType = (data.category as TabType) || 'token';
          onScanComplete(data, category);
          setScanResultNotice({ message: `Teks diekstrak ke kategori ${category.toUpperCase()}!`, isError: false });
          setShowPasteBox(false);
          setPasteText('');
          setIsScanning(false);
          return;
        }
      }
    } catch {
      // Fallback to local regex parser
    }

    // Local Regex Extraction Fallback
    const localData = parseLocalReceiptText(pasteText);
    onScanComplete(localData, localData.category);
    setScanResultNotice({
      message: `Teks berhasil diekstrak secara lokal ke ${localData.category.toUpperCase()}!`,
      isError: false,
    });
    setShowPasteBox(false);
    setPasteText('');
    setIsScanning(false);
  };

  const handleApplyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    onScanComplete(preset.data, preset.category);
    setScanResultNotice({
      message: `${preset.label} berhasil dimuat ke form!`,
      isError: false,
    });
    setShowPresets(false);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`bg-white p-3 rounded-xl border transition shadow-xs mb-3 no-print ${
        isDragOver ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-300' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pindai Screenshot Transaksi</span>
        </span>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-200">
          AI Vision Multimodal
        </span>
      </div>

      <p className="text-[11px] text-slate-500 mb-2.5 leading-snug">
        Upload atau <strong className="text-indigo-600">tekan Ctrl+V</strong> untuk paste tangkapan layar bukti PLN, Transfer Bank, atau QRIS.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Uploaded Thumbnail Preview */}
      {previewUrl && (
        <div className="mb-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={previewUrl} alt="Thumbnail Bukti" className="w-10 h-10 object-cover rounded border border-slate-300" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 m-0">Tangkapan Layar Dimuat</p>
              <p className="text-[10px] text-slate-500 m-0">Siap dipindai ulang jika diperlukan</p>
            </div>
          </div>
          <button
            onClick={() => setPreviewUrl(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
            title="Hapus pratinjau"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2 px-2 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Foto</span>
        </button>

        <button
          onClick={() => {
            setShowPasteBox(!showPasteBox);
            setShowPresets(false);
          }}
          className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold py-2 px-2 rounded-lg border border-slate-300 transition"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Tempel Teks</span>
        </button>

        <button
          onClick={() => {
            setShowPresets(!showPresets);
            setShowPasteBox(false);
          }}
          className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold py-2 px-2 rounded-lg border border-amber-300 transition"
        >
          <Play className="w-3 h-3 fill-amber-700" />
          <span>Tes Contoh</span>
        </button>
      </div>

      {/* Share Target Guide Banner Button */}
      {onOpenShareGuide && (
        <button
          type="button"
          onClick={onOpenShareGuide}
          className="w-full mt-2 flex items-center justify-between bg-teal-50/80 hover:bg-teal-100 active:scale-[0.99] border border-teal-200 text-teal-900 px-2.5 py-1.5 rounded-lg transition"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Share2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-[11px] font-bold truncate">
              Cetak via Menu "Bagikan / Share" dari Bank / WA
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-teal-700 bg-teal-200/60 px-1.5 py-0.5 rounded shrink-0">
            Lihat Cara
          </span>
        </button>
      )}

      {/* Loading state bar */}
      {isScanning && (
        <div className="mt-2.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
          <p className="text-xs text-indigo-800 font-bold m-0">{statusMessage}</p>
        </div>
      )}

      {/* Scan result notification */}
      {scanResultNotice && !isScanning && (
        <div
          className={`mt-2.5 p-2 rounded-lg flex items-center justify-between text-xs font-bold animate-in fade-in ${
            scanResultNotice.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {scanResultNotice.isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span>{scanResultNotice.message}</span>
          </div>
          <button
            onClick={() => setScanResultNotice(null)}
            className="text-slate-500 hover:text-slate-800 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Demo Presets Accordion */}
      {showPresets && (
        <div className="mt-2.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 animate-in fade-in">
          <p className="text-[11px] font-bold text-amber-900 m-0">Klik salah satu untuk menguji pemindaian otomatis:</p>
          <div className="flex flex-col gap-1">
            {DEMO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="text-left text-xs bg-white hover:bg-amber-100/70 text-slate-800 font-bold p-1.5 rounded border border-amber-200 transition flex items-center justify-between"
              >
                <span>{p.label}</span>
                <span className="text-[10px] text-amber-700 font-mono">Muat &gt;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paste box accordion */}
      {showPasteBox && (
        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 animate-in fade-in">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={3}
            placeholder="Tempelkan teks bukti transaksi / SMS perbankan / WA di sini..."
            className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono focus:outline-indigo-500 bg-white"
          />
          <button
            onClick={handleManualTextExtract}
            disabled={!pasteText.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
          >
            Ekstrak ke Form Sekarang
          </button>
        </div>
      )}
    </div>
  );
};
