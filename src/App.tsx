import React, { useState, useEffect } from 'react';
import {
  TabType,
  PlnTokenData,
  TransferData,
  QrisData,
  TokoData,
  StoreSettings,
  ReceiptHistoryItem,
} from './types';
import { Header } from './components/Header';
import { BluetoothBar } from './components/BluetoothBar';
import { ScreenshotScanBox } from './components/ScreenshotScanBox';
import { TabNavigation } from './components/TabNavigation';
import { TokenPlnForm } from './components/TokenPlnForm';
import { TransferForm } from './components/TransferForm';
import { QrisForm } from './components/QrisForm';
import { TokoForm } from './components/TokoForm';
import { ReceiptPreview } from './components/ReceiptPreview';
import { PrinterGuideModal } from './components/PrinterGuideModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { BleNoticeModal } from './components/BleNoticeModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getCurrentIndonesianDateTime, formatToken20 } from './utils/formatters';
import {
  connectBlePrinter,
  disconnectBlePrinter,
  globalBleState,
  EscPosBuilder,
  buildEscPosReceipt,
  printViaRawBt,
  printViaBle,
  BlePermissionError,
} from './utils/printer';
import { playChimeSound, announceTransaction } from './utils/sound';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'KONTER BERKAH CELL',
  tagline: 'PPOB, Token PLN, Pulsa & Transfer Bank',
  address: 'Jl. Pemuda No. 45, Pasar Baru',
  phone: '0812-3456-7890',
  footerMessage: 'Terima kasih atas kunjungan Anda. Struk ini bukti transaksi sah.',
  paperWidth: '58mm',
  fontSize: 'md',
  soundEnabled: true,
  autoAnnounceOnPrint: true,
  showBarcode: true,
};

export default function App() {
  // Store Settings (saved in localStorage)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('kasir_struk_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('token');

  // Transaction History (saved in localStorage)
  const [history, setHistory] = useState<ReceiptHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kasir_struk_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bluetooth BLE Connection State
  const [bleConnected, setBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState('Kompatibel Semua Merek');
  const [isConnectingBle, setIsConnectingBle] = useState(false);

  // Modals & Notifications
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBleNoticeModal, setShowBleNoticeModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ================= FORM STATES =================
  // Tab 1: Token PLN
  const [plnData, setPlnData] = useState<PlnTokenData>({
    waktu: getCurrentIndonesianDateTime(),
    sn: '09283719283910',
    idpel: '54128903211',
    nama: 'BUDI SANTOSO',
    tarifDaya: 'R1M / 900 VA',
    kwh: '33.1 kWh',
    token: '2819-8392-1092-8492-1289',
    nominal: 50000,
    adminPln: 3000,
    adminKonter: 2000,
    statusAdminPln: true,
    statusAdminKonter: true,
    total: 55000,
  });

  // Tab 2: Transfer Bank
  const [transferData, setTransferData] = useState<TransferData>({
    waktu: getCurrentIndonesianDateTime(),
    refNo: 'TRX' + Math.floor(Math.random() * 900000 + 100000),
    bankPengirim: 'BCA',
    bankTujuan: 'BRI',
    rekeningPengirim: '8291029381',
    sensorRekening: true,
    rekeningTujuan: '002101038291503',
    namaPenerima: 'SITI AMINAH',
    nominal: 100000,
    adminBank: 2500,
    adminKonter: 2500,
    statusAdminBank: true,
    statusAdminKonter: true,
    total: 105000,
    status: 'BERHASIL',
    catatan: 'Pembayaran tagihan',
  });

  // Tab 3: QRIS Pay
  const [qrisData, setQrisData] = useState<QrisData>({
    waktu: getCurrentIndonesianDateTime(),
    refNo: 'QR' + Math.floor(Math.random() * 90000000 + 10000000),
    merchantName: settings.storeName || 'KONTER BERKAH',
    nmid: 'ID1020039281921',
    acquirer: 'SHOPEEPAY',
    customerName: 'AHMAD FAUZI',
    nominal: 25000,
    fee: 0,
    total: 25000,
    status: 'SUKSES DITERIMA',
  });

  // Tab 4: Toko & Suara
  const [tokoData, setTokoData] = useState<TokoData>({
    waktu: getCurrentIndonesianDateTime(),
    noStruk: 'STRUK-' + Math.floor(Math.random() * 9000 + 1000),
    kasir: 'Kasir 1',
    customerName: 'Pelanggan Umum',
    items: [
      { id: '1', name: 'Kopi Seduh Panas', qty: 2, price: 4000, subtotal: 8000 },
      { id: '2', name: 'Rokok Surya 16', qty: 1, price: 36000, subtotal: 36000 },
      { id: '3', name: 'Mie Instan Goreng', qty: 3, price: 3500, subtotal: 10500 },
    ],
    diskon: 0,
    biayaLain: 0,
    total: 54500,
    tunai: 60000,
    kembali: 5500,
    metodeBayar: 'TUNAI',
  });

  // Save settings to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('kasir_struk_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [settings]);

  // Save history to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('kasir_struk_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [history]);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Connect BLE Driver
  const handleConnectBle = async () => {
    setIsConnectingBle(true);
    try {
      const state = await connectBlePrinter((newState) => {
        setBleConnected(newState.isConnected);
        setBleDeviceName(newState.deviceName);
      });
      setBleConnected(state.isConnected);
      setBleDeviceName(state.deviceName);
      addToast(`Printer Bluetooth terhubung: ${state.deviceName}`, 'success');
      if (settings.soundEnabled) playChimeSound();
    } catch (err: any) {
      if (err?.name === 'BlePermissionError' || err?.isSecurityBlocked) {
        // Open polite notice modal explaining iframe permissions policy & suggesting RawBT
        setShowBleNoticeModal(true);
      } else if (err?.name !== 'NotFoundError') {
        addToast(err?.message || 'Gagal menghubungkan Bluetooth. Pastikan Bluetooth & GPS aktif.', 'warning');
      }
    } finally {
      setIsConnectingBle(false);
    }
  };

  // Disconnect BLE
  const handleDisconnectBle = () => {
    disconnectBlePrinter();
    setBleConnected(false);
    setBleDeviceName('Kompatibel Semua Merek');
    addToast('Koneksi Bluetooth diputus.', 'info');
  };

  // Test Print pattern
  const handleTestPrint = async () => {
    if (settings.soundEnabled) playChimeSound();

    const builder = new EscPosBuilder();
    builder.alignCenter().bold(true);
    builder.line('*** TEST PRINT THERMAL ***');
    builder.line(settings.storeName.toUpperCase());
    builder.bold(false);
    builder.line('Driver Universal Bluetooth');
    builder.line(`Status: SINKRONISASI SUKSES`);
    builder.line(`Waktu: ${getCurrentIndonesianDateTime()}`);
    builder.line('Lebar Kertas: ' + settings.paperWidth);
    builder.divider(settings.paperWidth === '80mm' ? 48 : 32, '=');
    builder.line('1234567890 ABCD EFGH #$%&');
    builder.alignCenter().bold(true);
    builder.line('PRINTER SIAP DIGUNAKAN');
    builder.feed(3).cut();

    if (bleConnected && globalBleState.characteristic) {
      try {
        await printViaBle(builder.getBytes());
        return;
      } catch (e) {
        console.warn('BLE print test failed, fallback to RawBT', e);
      }
    }

    // Default: RawBT
    printViaRawBt(builder.getBase64());
  };

  // Handle OCR scan complete: populate corresponding form and switch tab
  const handleScanComplete = (extracted: any, targetCategory?: TabType) => {
    const cat: TabType = targetCategory || extracted.category || 'token';
    setActiveTab(cat);

    if (cat === 'token') {
      setPlnData((prev) => {
        const nom = extracted.nominal || prev.nominal;
        const admPln = extracted.adminBank !== undefined ? extracted.adminBank : prev.adminPln;
        const admKtr = extracted.adminKonter !== undefined ? extracted.adminKonter : prev.adminKonter;
        return {
          ...prev,
          waktu: extracted.waktu || getCurrentIndonesianDateTime(),
          sn: extracted.refNo || prev.sn,
          idpel: extracted.idpel || prev.idpel,
          nama: extracted.namaPelanggan || prev.nama,
          tarifDaya: extracted.tarifDaya || prev.tarifDaya,
          kwh: extracted.kwh || prev.kwh,
          token: extracted.tokenNumber ? formatToken20(extracted.tokenNumber) : prev.token,
          nominal: nom,
          adminPln: admPln,
          adminKonter: admKtr,
          total: extracted.total || nom + admPln + admKtr,
        };
      });
    } else if (cat === 'transfer') {
      setTransferData((prev) => {
        const nom = extracted.nominal || prev.nominal;
        const admBank = extracted.adminBank !== undefined ? extracted.adminBank : prev.adminBank;
        const admKtr = extracted.adminKonter !== undefined ? extracted.adminKonter : prev.adminKonter;
        return {
          ...prev,
          waktu: extracted.waktu || getCurrentIndonesianDateTime(),
          refNo: extracted.refNo || prev.refNo,
          bankPengirim: extracted.bankPengirim || prev.bankPengirim,
          bankTujuan: extracted.bankTujuan || prev.bankTujuan,
          rekeningTujuan: extracted.rekeningTujuan || prev.rekeningTujuan,
          namaPenerima: extracted.namaPenerima || prev.namaPenerima,
          nominal: nom,
          adminBank: admBank,
          adminKonter: admKtr,
          total: extracted.total || nom + admBank + admKtr,
          status: extracted.status || 'BERHASIL',
          catatan: extracted.catatan || prev.catatan,
        };
      });
    } else if (cat === 'qris') {
      setQrisData((prev) => ({
        ...prev,
        waktu: extracted.waktu || getCurrentIndonesianDateTime(),
        refNo: extracted.refNo || prev.refNo,
        merchantName: extracted.merchantName || prev.merchantName,
        nmid: extracted.nmid || prev.nmid,
        acquirer: extracted.acquirer || prev.acquirer,
        customerName: extracted.customerName || prev.customerName,
        nominal: extracted.nominal || prev.nominal,
        fee: extracted.adminBank || prev.fee,
        total: extracted.total || prev.total,
      }));
    } else if (cat === 'toko') {
      if (extracted.items && Array.isArray(extracted.items) && extracted.items.length > 0) {
        const formattedItems = extracted.items.map((it: any, idx: number) => ({
          id: 'item_' + Date.now() + idx,
          name: it.name || 'Produk',
          qty: it.qty || 1,
          price: it.price || 0,
          subtotal: (it.qty || 1) * (it.price || 0),
        }));
        const total = extracted.total || formattedItems.reduce((a: number, c: any) => a + c.subtotal, 0);
        setTokoData((prev) => ({
          ...prev,
          items: formattedItems,
          total,
          tunai: total,
          kembali: 0,
        }));
      }
    }

    if (settings.soundEnabled) playChimeSound();
  };

  // Record into History
  const handleRecordHistory = () => {
    let title = '';
    let customer = '';
    let nominal = 0;
    let total = 0;
    let dataObj: any = null;

    if (activeTab === 'token') {
      title = `Token PLN - ${plnData.tarifDaya}`;
      customer = `${plnData.nama} (${plnData.idpel})`;
      nominal = plnData.nominal;
      total = plnData.total;
      dataObj = { ...plnData };
    } else if (activeTab === 'transfer') {
      title = `Transfer ${transferData.bankPengirim} ke ${transferData.bankTujuan}`;
      customer = `${transferData.namaPenerima} (${transferData.rekeningTujuan})`;
      nominal = transferData.nominal;
      total = transferData.total;
      dataObj = { ...transferData };
    } else if (activeTab === 'qris') {
      title = `QRIS ${qrisData.acquirer} - ${qrisData.merchantName}`;
      customer = qrisData.customerName || 'Umum';
      nominal = qrisData.nominal;
      total = qrisData.total;
      dataObj = { ...qrisData };
    } else if (activeTab === 'toko') {
      title = `Toko (${tokoData.items.length} items) - ${tokoData.noStruk}`;
      customer = tokoData.customerName || 'Pelanggan Umum';
      nominal = tokoData.total;
      total = tokoData.total;
      dataObj = { ...tokoData };
    }

    const item: ReceiptHistoryItem = {
      id: 'TRX' + Date.now(),
      timestamp: getCurrentIndonesianDateTime(),
      category: activeTab,
      title,
      customer,
      nominal,
      total,
      data: dataObj,
    };

    setHistory((prev) => [item, ...prev.slice(0, 99)]);
  };

  // Load item from history back into form
  const handleLoadHistoryItem = (item: ReceiptHistoryItem) => {
    setActiveTab(item.category);
    if (item.category === 'token') {
      setPlnData(item.data as PlnTokenData);
    } else if (item.category === 'transfer') {
      setTransferData(item.data as TransferData);
    } else if (item.category === 'qris') {
      setQrisData(item.data as QrisData);
    } else if (item.category === 'toko') {
      setTokoData(item.data as TokoData);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus semua riwayat transaksi tersimpan?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
        historyCount={history.length}
        bleConnected={bleConnected}
        bleDeviceName={bleDeviceName}
      />

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto p-3 flex-1">
        {/* Universal Bluetooth Driver Bar */}
        <BluetoothBar
          bleConnected={bleConnected}
          bleDeviceName={bleDeviceName}
          onConnectBle={handleConnectBle}
          onDisconnectBle={handleDisconnectBle}
          onTestPrint={handleTestPrint}
          onOpenRawBt={() => {
            const currentData =
              activeTab === 'token'
                ? plnData
                : activeTab === 'transfer'
                ? transferData
                : activeTab === 'qris'
                ? qrisData
                : tokoData;
            const builder = buildEscPosReceipt(activeTab, currentData, settings);
            printViaRawBt(builder.getBase64());
            handleRecordHistory();
            if (settings.autoAnnounceOnPrint && settings.soundEnabled) {
              const totalAmount =
                activeTab === 'token'
                  ? plnData.total
                  : activeTab === 'transfer'
                  ? transferData.total
                  : activeTab === 'qris'
                  ? qrisData.total
                  : tokoData.total;
              announceTransaction(totalAmount, activeTab, settings.storeName);
            }
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isConnectingBle={isConnectingBle}
        />

        {/* Screenshot / Text OCR Scan Bar */}
        <ScreenshotScanBox onScanComplete={handleScanComplete} />

        {/* 4 Feature Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Feature Form */}
        {activeTab === 'token' && <TokenPlnForm data={plnData} onChange={setPlnData} />}
        {activeTab === 'transfer' && <TransferForm data={transferData} onChange={setTransferData} />}
        {activeTab === 'qris' && <QrisForm data={qrisData} onChange={setQrisData} />}
        {activeTab === 'toko' && (
          <TokoForm data={tokoData} onChange={setTokoData} storeName={settings.storeName} />
        )}

        {/* Live Thermal Receipt Preview & Printing Actions */}
        <ReceiptPreview
          activeTab={activeTab}
          plnData={plnData}
          transferData={transferData}
          qrisData={qrisData}
          tokoData={tokoData}
          settings={settings}
          onRecordHistory={handleRecordHistory}
          bleConnected={bleConnected}
          onConnectBlePrompt={handleConnectBle}
          onNotify={addToast}
        />
      </main>

      {/* Modals & Drawers */}
      <BleNoticeModal
        isOpen={showBleNoticeModal}
        onClose={() => setShowBleNoticeModal(false)}
        onOpenRawBt={() => {
          const currentData =
            activeTab === 'token'
              ? plnData
              : activeTab === 'transfer'
              ? transferData
              : activeTab === 'qris'
              ? qrisData
              : tokoData;
          const builder = buildEscPosReceipt(activeTab, currentData, settings);
          printViaRawBt(builder.getBase64());
          handleRecordHistory();
          addToast('Membuka driver RawBT...', 'info');
        }}
        onOpenBrowserPrint={() => {
          window.print();
          handleRecordHistory();
        }}
      />

      <PrinterGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      <StoreSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSave={setSettings}
        onResetDefaults={() => setSettings(DEFAULT_SETTINGS)}
      />

      <HistoryDrawer
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
