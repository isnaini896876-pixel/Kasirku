import React, { useState } from 'react';
import { Bluetooth, CheckCircle2, HelpCircle, RefreshCw, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { StoreSettings } from '../types';

interface BluetoothBarProps {
  bleConnected: boolean;
  bleDeviceName: string;
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  onTestPrint: () => void;
  onOpenRawBt: () => void;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  isConnectingBle: boolean;
}

export const BluetoothBar: React.FC<BluetoothBarProps> = ({
  bleConnected,
  bleDeviceName,
  onConnectBle,
  onDisconnectBle,
  onTestPrint,
  onOpenRawBt,
  settings,
  onUpdateSettings,
  isConnectingBle,
}) => {
  const [showBrandGuide, setShowBrandGuide] = useState(false);

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3 no-print">
      <div className="flex justify-between items-center mb-2.5">
        <div>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
            Driver Bluetooth Universal
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                bleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <p className="text-xs font-bold text-slate-800">
              {bleConnected ? bleDeviceName : 'Kompatibel Semua Merek'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Paper Width Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              onClick={() => onUpdateSettings({ paperWidth: '58mm' })}
              className={`px-2 py-1 rounded transition ${
                settings.paperWidth === '58mm'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => onUpdateSettings({ paperWidth: '80mm' })}
              className={`px-2 py-1 rounded transition ${
                settings.paperWidth === '80mm'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm
            </button>
          </div>

          {/* Test Print Button */}
          <button
            onClick={onTestPrint}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition"
            title="Kirim Struk Tes untuk cek keselarasan printer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Test Print</span>
          </button>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
        <button
          onClick={bleConnected ? onDisconnectBle : onConnectBle}
          disabled={isConnectingBle}
          className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg border transition ${
            bleConnected
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          {isConnectingBle ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bluetooth className="w-3.5 h-3.5" />
          )}
          <span>{bleConnected ? 'Putus BLE' : 'Hubungkan BLE'}</span>
        </button>

        <button
          onClick={() => setShowBrandGuide(!showBrandGuide)}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Panduan Merek</span>
          {showBrandGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* RawBT Quick Print Banner */}
      <button
        onClick={onOpenRawBt}
        className="w-full mt-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-xs font-extrabold py-2.5 px-3 rounded-lg shadow-sm transition tracking-tight"
      >
        <Smartphone className="w-4 h-4" />
        <span>CETAK KE PRINTER THERMAL (RAWBT)</span>
      </button>

      {/* Expandable Guide Box */}
      {showBrandGuide && (
        <div className="mt-2.5 bg-amber-50/90 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-900 space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <p className="font-bold flex items-center gap-1">
            <span>💡</span> Panduan Cetak Semua Merek (Panda, EPPOS, VSC, GOOJPRT, RPP02N, ZJiang, Iware, Bellav, dll):
          </p>
          <p>
            1. <b>Metode Universal (Paling Stabil):</b> Tekan tombol hijau{' '}
            <b>"CETAK KE PRINTER THERMAL (RAWBT)"</b>. Driver RawBT otomatis menyesuaikan bahasa perintah ESC/POS untuk
            printer merek apa pun baik via Bluetooth, USB OTG, maupun WiFi.
          </p>
          <p>
            2. <b>Metode BLE Direct:</b> Jika printer Anda memiliki modul BLE bawaan, aktifkan <b>Bluetooth & GPS HP</b>
            , lalu tekan <b>"Hubungkan BLE"</b> untuk cetak langsung dari browser Chrome tanpa install aplikasi lain.
          </p>
          <p>
            3. <b>Metode Web Print / Browser:</b> Tekan tombol <b>"Cetak Browser / PDF"</b> untuk mencetak via dialog cetak
            sistem HP atau PC ke thermal printer atau save as PDF.
          </p>
        </div>
      )}
    </div>
  );
};
