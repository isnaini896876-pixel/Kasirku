import React, { useState, useRef } from 'react';
import { Upload, Clipboard, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseLocalReceiptText } from '../utils/ocrFallback';
import { TabType } from '../types';

interface ScreenshotScanBoxProps {
  onScanComplete: (data: any, targetTab?: TabType) => void;
}

export const ScreenshotScanBox: React.FC<ScreenshotScanBoxProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setStatusMessage('Membaca bukti transaksi dengan Gemini AI...');
    setScanResultNotice(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        // Try calling server-side Gemini OCR endpoint
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const data = resJson.data;
            const category: TabType = (data.category as TabType) || 'token';
            onScanComplete(data, category);
            setScanResultNotice(`Berhasil membaca bukti ${category.toUpperCase()}!`);
            setIsScanning(false);
            return;
          }
        }

        // If server failed or offline, fallback to local parsing or prompt
        throw new Error('Server AI tidak merespon, mencoba parser alternatif.');
      } catch (err: any) {
        console.warn('AI OCR fallback:', err);
        setStatusMessage('Menganalisis pola teks gambar...');

        // If Tesseract is loaded in window or fallback
        setScanResultNotice('Gambar diunggah. Untuk hasil tercepat, Anda juga bisa menyalin teks bukti transfer.');
        setIsScanning(false);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setIsScanning(false);
      setStatusMessage('');
      setScanResultNotice('Gagal membaca file gambar yang diunggah.');
    };

    reader.readAsDataURL(file);
  };

  const handleManualTextExtract = async () => {
    if (!pasteText.trim()) return;

    setIsScanning(true);
    setStatusMessage('Menganalisis teks transaksi...');
    setScanResultNotice(null);

    try {
      // First attempt: Server AI parsing
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
          setScanResultNotice(`Teks diekstrak ke ${category.toUpperCase()}!`);
          setShowPasteBox(false);
          setPasteText('');
          setIsScanning(false);
          return;
        }
      }
    } catch {
      // AI server unavailable, fall through to local regex parser
    }

    // Local Regex Extraction Fallback
    const localData = parseLocalReceiptText(pasteText);
    onScanComplete(localData, localData.category);
    setScanResultNotice(`Teks diekstrak secara lokal ke ${localData.category.toUpperCase()}!`);
    setShowPasteBox(false);
    setPasteText('');
    setIsScanning(false);
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3 no-print">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pindai Screenshot Transaksi</span>
        </span>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
          Auto Read AI
        </span>
      </div>

      <p className="text-[11px] text-slate-500 mb-2">
        Upload tangkapan layar bukti bayar PLN, Bank, atau E-Wallet untuk otomatis mengisi form.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Foto</span>
        </button>

        <button
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg border border-slate-300 transition"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Tempel Teks</span>
        </button>
      </div>

      {/* Loading state bar */}
      {isScanning && (
        <div className="mt-2.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <p className="text-xs text-indigo-700 font-bold m-0">{statusMessage}</p>
        </div>
      )}

      {/* Scan result notification */}
      {scanResultNotice && !isScanning && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-semibold animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{scanResultNotice}</span>
          </div>
          <button
            onClick={() => setScanResultNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paste box accordion */}
      {showPasteBox && (
        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={3}
            placeholder="Tempelkan teks bukti transaksi / SMS / WA di sini..."
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
