import React, { useState, useEffect } from 'react';
import {
  TabType,
  PlnTokenData,
  TransferData,
  QrisData,
  TokoData,
  StoreSettings,
  ReceiptHistoryItem,
  MasterQrisConfig,
  QrisMerchantAccount,
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
import { QrisDisplayModal } from './components/QrisDisplayModal';
import { OnlineShareModal } from './components/OnlineShareModal';
import { ShareGuideModal } from './components/ShareGuideModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PWAInstallButton } from './components/PWAInstallButton';
import { getCurrentIndonesianDateTime, formatToken20 } from './utils/formatters';
import {
  generateStandardQris,
  convertToDynamicQris,
  convertToStaticQris,
  SAMPLE_QRIS_PRESETS,
} from './utils/qris';
import { useShareTarget } from './hooks/useShareTarget';
import {
  connectBlePrinter,
  disconnectBlePrinter,
  globalBleState,
  EscPosBuilder,
  buildEscPosReceipt,
  buildQrisStandeeReceipt,
  buildAllQrisStandeesReceipt,
  printViaRawBt,
  printViaBle,
  BlePermissionError,
} from './utils/printer';
import { playChimeSound, announceTransaction } from './utils/sound';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const DEFAULT_QRIS_MERCHANTS: QrisMerchantAccount[] = [
  {
    id: 'merchant_1',
    merchantName: 'KONTER BERKAH CELL',
    nmid: 'ID1020039281921',
    acquirer: 'BCA QRIS',
    city: 'JAKARTA',
    qrisPayload: SAMPLE_QRIS_PRESETS[0].samplePayload,
    isDefault: true,
    notes: 'Kasir Utama & Counter Depan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'merchant_2',
    merchantName: 'WARUNG KOPI & SNACK',
    nmid: 'ID1020083921029',
    acquirer: 'DANA BISNIS',
    city: 'SURABAYA',
    qrisPayload: SAMPLE_QRIS_PRESETS[1].samplePayload,
    isDefault: false,
    notes: 'Khusus Pesanan Kopi & Makanan Ringan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'merchant_3',
    merchantName: 'WARUNG DIGITAL SERBA ADA',
    nmid: 'ID1020094829103',
    acquirer: 'SHOPEEPAY MERCHANT',
    city: 'BANDUNG',
    qrisPayload: SAMPLE_QRIS_PRESETS[2].samplePayload,
    isDefault: false,
    notes: 'Toko Kelontong & Sembako',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MASTER_QRIS: MasterQrisConfig = {
  merchantName: DEFAULT_QRIS_MERCHANTS[0].merchantName,
  nmid: DEFAULT_QRIS_MERCHANTS[0].nmid,
  acquirer: DEFAULT_QRIS_MERCHANTS[0].acquirer,
  city: DEFAULT_QRIS_MERCHANTS[0].city,
  qrisPayload: DEFAULT_QRIS_MERCHANTS[0].qrisPayload,
  isConfigured: true,
  savedAt: new Date().toISOString(),
};

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
  masterQris: DEFAULT_MASTER_QRIS,
  qrisMerchants: DEFAULT_QRIS_MERCHANTS,
  activeQrisMerchantId: DEFAULT_QRIS_MERCHANTS[0].id,
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

  // Master QRIS Permanent Configuration (saved in localStorage)
  const [masterQris, setMasterQris] = useState<MasterQrisConfig>(() => {
    try {
      const savedMaster = localStorage.getItem('kasir_struk_master_qris');
      if (savedMaster) {
        return JSON.parse(savedMaster);
      }
      const savedSettings = localStorage.getItem('kasir_struk_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.masterQris) return parsed.masterQris;
      }
      return DEFAULT_MASTER_QRIS;
    } catch {
      return DEFAULT_MASTER_QRIS;
    }
  });

  // Online Cloud Connection & Heartbeat
  const { isOnline, serverStatus, latency, checkNow } = useOnlineStatus();
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  // Saved QRIS Merchant Accounts (saved in localStorage)
  const [qrisMerchants, setQrisMerchants] = useState<QrisMerchantAccount[]>(() => {
    try {
      const saved = localStorage.getItem('kasir_struk_qris_merchants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved merchants', e);
    }
    return DEFAULT_QRIS_MERCHANTS;
  });

  const [activeQrisMerchantId, setActiveQrisMerchantId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('kasir_struk_active_merchant_id');
      if (savedId) return savedId;
    } catch {}
    return DEFAULT_QRIS_MERCHANTS[0].id;
  });

  const [settingsModalInitialTab, setSettingsModalInitialTab] = useState<'profil' | 'qris'>('profil');

  // Bluetooth BLE Connection State
  const [bleConnected, setBleConnected] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState('Kompatibel Semua Merek');
  const [isConnectingBle, setIsConnectingBle] = useState(false);

  // Modals & Notifications
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBleNoticeModal, setShowBleNoticeModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);
  const [sharedFileToProcess, setSharedFileToProcess] = useState<File | null>(null);
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

  // Web Share Target: listen for images shared from other Android apps (Bank, E-Wallet, WA)
  useShareTarget({
    onImageReceived: (file) => {
      setSharedFileToProcess(file);
      addToast('Menerima gambar bukti transaksi dari menu Bagikan (Share)! Memproses...', 'info');
    },
    onNotify: addToast,
  });

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
    namaPengirim: 'KONTER BERKAH',
    kategoriPengirim: 'Rekening Utama Toko',
    tampilkanRekeningPengirim: true,
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
    tampilkanCatatan: true,
  });

  // Tab 3: QRIS Pay (Dinamis & Statis - Loaded from permanent master)
  const [qrisData, setQrisData] = useState<QrisData>(() => {
    const store = masterQris.merchantName || settings.storeName || 'KONTER BERKAH CELL';
    const nmid = masterQris.nmid || 'ID1020039281921';
    const nominal = 25000;
    const initialPayload = masterQris.qrisPayload
      ? convertToDynamicQris(masterQris.qrisPayload, nominal, 'QR' + Math.floor(Math.random() * 90000 + 10000))
      : generateStandardQris(store, nmid, masterQris.city || 'JAKARTA', true, nominal);

    return {
      waktu: getCurrentIndonesianDateTime(),
      refNo: 'QR' + Math.floor(Math.random() * 90000000 + 10000000),
      merchantName: store,
      nmid,
      acquirer: masterQris.acquirer || 'QRIS NASIONAL',
      customerName: 'PELANGGAN UMUM',
      nominal,
      fee: 0,
      total: nominal,
      status: 'SUKSES DITERIMA',
      qrisType: 'dinamis',
      qrisPayload: initialPayload,
      printQrOnReceipt: true,
      city: masterQris.city || 'JAKARTA',
    };
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
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.masterQris) {
        setMasterQris(newSettings.masterQris);
        try {
          localStorage.setItem('kasir_struk_master_qris', JSON.stringify(newSettings.masterQris));
        } catch {}
      }
      return updated;
    });
  };

  // Save permanent Master QRIS to localStorage and propagate to active QRIS
  const handleSaveMasterQris = (newMaster: MasterQrisConfig) => {
    setMasterQris(newMaster);
    try {
      localStorage.setItem('kasir_struk_master_qris', JSON.stringify(newMaster));
      setSettings((prev) => {
        const updated = { ...prev, masterQris: newMaster };
        localStorage.setItem('kasir_struk_settings', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn('Failed to save master QRIS', e);
    }

    // Immediately sync active qrisData
    setQrisData((prev) => {
      const isDynamic = prev.qrisType === 'dinamis';
      const targetNominal = prev.total > 0 ? prev.total : prev.nominal;
      let newPayload = newMaster.qrisPayload;
      try {
        if (isDynamic) {
          newPayload = convertToDynamicQris(newMaster.qrisPayload, targetNominal > 0 ? targetNominal : 1, prev.refNo);
        } else {
          newPayload = convertToStaticQris(newMaster.qrisPayload);
        }
      } catch {
        newPayload = newMaster.qrisPayload;
      }

      return {
        ...prev,
        merchantName: newMaster.merchantName,
        nmid: newMaster.nmid,
        acquirer: newMaster.acquirer,
        city: newMaster.city,
        qrisPayload: newPayload,
      };
    });

    addToast(`QRIS Toko "${newMaster.merchantName}" berhasil disimpan permanen!`, 'success');
  };

  // Save qrisMerchants to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('kasir_struk_qris_merchants', JSON.stringify(qrisMerchants));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [qrisMerchants]);

  // Select active merchant account
  const handleSelectQrisMerchant = (merchant: QrisMerchantAccount) => {
    setActiveQrisMerchantId(merchant.id);
    try {
      localStorage.setItem('kasir_struk_active_merchant_id', merchant.id);
    } catch {}

    const newMaster: MasterQrisConfig = {
      merchantName: merchant.merchantName,
      nmid: merchant.nmid,
      acquirer: merchant.acquirer,
      city: merchant.city,
      qrisPayload: merchant.qrisPayload,
      isConfigured: true,
      savedAt: new Date().toISOString(),
    };
    setMasterQris(newMaster);
    try {
      localStorage.setItem('kasir_struk_master_qris', JSON.stringify(newMaster));
    } catch {}

    setQrisData((prev) => {
      const isDynamic = prev.qrisType === 'dinamis';
      const targetNominal = prev.total > 0 ? prev.total : prev.nominal;
      let newPayload = merchant.qrisPayload;
      try {
        if (isDynamic) {
          newPayload = convertToDynamicQris(merchant.qrisPayload, targetNominal > 0 ? targetNominal : 1, prev.refNo);
        } else {
          newPayload = convertToStaticQris(merchant.qrisPayload);
        }
      } catch {
        newPayload = merchant.qrisPayload;
      }

      return {
        ...prev,
        merchantName: merchant.merchantName,
        nmid: merchant.nmid,
        acquirer: merchant.acquirer,
        city: merchant.city,
        qrisPayload: newPayload,
      };
    });

    addToast(`Akun QRIS beralih ke "${merchant.merchantName}" (${merchant.acquirer})!`, 'success');
  };

  const handleAddQrisMerchant = (newMerchant: Omit<QrisMerchantAccount, 'id'>) => {
    const item: QrisMerchantAccount = {
      ...newMerchant,
      id: 'merchant_' + Date.now(),
    };
    setQrisMerchants((prev) => {
      let updated = [...prev];
      if (item.isDefault) {
        updated = updated.map((m) => ({ ...m, isDefault: false }));
      }
      return [item, ...updated];
    });
    handleSelectQrisMerchant(item);
  };

  const handleUpdateQrisMerchant = (updatedMerchant: QrisMerchantAccount) => {
    setQrisMerchants((prev) =>
      prev.map((m) => {
        if (m.id === updatedMerchant.id) return updatedMerchant;
        if (updatedMerchant.isDefault) return { ...m, isDefault: false };
        return m;
      })
    );

    if (activeQrisMerchantId === updatedMerchant.id) {
      handleSelectQrisMerchant(updatedMerchant);
    }
  };

  const handleDeleteQrisMerchant = (id: string) => {
    if (qrisMerchants.length <= 1) {
      addToast('Minimal harus ada 1 akun QRIS tersimpan.', 'warning');
      return;
    }
    setQrisMerchants((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      if (activeQrisMerchantId === id && filtered.length > 0) {
        handleSelectQrisMerchant(filtered[0]);
      }
      return filtered;
    });
    addToast('Akun QRIS berhasil dihapus.', 'info');
  };

  // Print single merchant standee barcode
  const handlePrintMerchantStandee = async (merchant: QrisMerchantAccount) => {
    if (settings.soundEnabled) playChimeSound();
    const builder = buildQrisStandeeReceipt(merchant, settings);

    if (bleConnected && globalBleState.characteristic) {
      try {
        await printViaBle(builder.getBytes());
        addToast(`Mencetak barcode QRIS "${merchant.merchantName}" via Bluetooth BLE...`, 'success');
        return;
      } catch (e) {
        console.warn('BLE print standee failed, fallback to RawBT', e);
      }
    }

    printViaRawBt(builder.getBase64());
    addToast(`Mencetak barcode QRIS "${merchant.merchantName}" ke printer thermal...`, 'info');
  };

  // Batch print all saved merchant standees
  const handlePrintAllStandees = async () => {
    if (settings.soundEnabled) playChimeSound();
    const builder = buildAllQrisStandeesReceipt(qrisMerchants, settings);

    if (bleConnected && globalBleState.characteristic) {
      try {
        await printViaBle(builder.getBytes());
        addToast(`Mencetak batch ${qrisMerchants.length} barcode QRIS via Bluetooth BLE...`, 'success');
        return;
      } catch (e) {
        console.warn('BLE print all standees failed, fallback to RawBT', e);
      }
    }

    printViaRawBt(builder.getBase64());
    addToast(`Mencetak batch ${qrisMerchants.length} barcode QRIS ke printer thermal...`, 'info');
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
    const rawCat = (targetCategory || extracted.category || '').toLowerCase();
    let cat: TabType = 'token';
    if (rawCat.includes('pln') || rawCat.includes('token') || rawCat.includes('listrik') || rawCat.includes('stroom')) {
      cat = 'token';
    } else if (rawCat.includes('transfer') || rawCat.includes('bank') || rawCat.includes('kirim') || rawCat.includes('dana') || rawCat.includes('ovo') || rawCat.includes('gopay') || rawCat.includes('shopee')) {
      cat = 'transfer';
    } else if (rawCat.includes('qris') || rawCat.includes('merchant') || rawCat.includes('nmid')) {
      cat = 'qris';
    } else if (rawCat.includes('toko') || rawCat.includes('retail') || rawCat.includes('kasir') || rawCat.includes('belanja')) {
      cat = 'toko';
    } else if (targetCategory) {
      cat = targetCategory;
    }

    setActiveTab(cat);

    const safeWaktu = (extracted.waktu && extracted.waktu !== 'null' && extracted.waktu !== 'None' && String(extracted.waktu).trim() !== '')
      ? String(extracted.waktu)
      : getCurrentIndonesianDateTime();

    if (cat === 'token') {
      setPlnData((prev) => {
        const nom = Number(extracted.nominal) || prev.nominal;
        const admPln = extracted.adminBank !== undefined ? Number(extracted.adminBank) : prev.adminPln;
        const admKtr = extracted.adminKonter !== undefined ? Number(extracted.adminKonter) : prev.adminKonter;
        return {
          ...prev,
          waktu: safeWaktu,
          sn: extracted.refNo || prev.sn,
          idpel: extracted.idpel || prev.idpel,
          nama: extracted.namaPelanggan || prev.nama,
          tarifDaya: extracted.tarifDaya || prev.tarifDaya,
          kwh: extracted.kwh || prev.kwh,
          token: extracted.tokenNumber ? formatToken20(extracted.tokenNumber) : prev.token,
          nominal: nom,
          adminPln: admPln,
          adminKonter: admKtr,
          total: Number(extracted.total) || (nom + admPln + admKtr),
        };
      });
      addToast('Bukti Token PLN berhasil dipindai & dimasukkan ke form!', 'success');
    } else if (cat === 'transfer') {
      setTransferData((prev) => {
        const nom = Number(extracted.nominal) || prev.nominal;
        const admBank = extracted.adminBank !== undefined ? Number(extracted.adminBank) : prev.adminBank;
        const admKtr = extracted.adminKonter !== undefined ? Number(extracted.adminKonter) : prev.adminKonter;
        return {
          ...prev,
          waktu: safeWaktu,
          refNo: extracted.refNo || prev.refNo,
          bankPengirim: extracted.bankPengirim || prev.bankPengirim,
          bankTujuan: extracted.bankTujuan || prev.bankTujuan,
          rekeningTujuan: extracted.rekeningTujuan || prev.rekeningTujuan,
          namaPenerima: extracted.namaPenerima || prev.namaPenerima,
          nominal: nom,
          adminBank: admBank,
          adminKonter: admKtr,
          total: Number(extracted.total) || (nom + admBank + admKtr),
          status: extracted.status || 'BERHASIL',
          catatan: extracted.catatan || prev.catatan,
        };
      });
      addToast('Bukti Transfer Bank/E-Wallet berhasil dipindai & dimasukkan ke form!', 'success');
    } else if (cat === 'qris') {
      setQrisData((prev) => {
        const nom = Number(extracted.nominal) || prev.nominal;
        const fee = extracted.adminBank !== undefined ? Number(extracted.adminBank) : prev.fee;
        const total = Number(extracted.total) || (nom + fee);
        const mName = extracted.merchantName || prev.merchantName;
        const mNmid = extracted.nmid || prev.nmid;
        const isDynamic = prev.qrisType === 'dinamis';
        const newPayload = generateStandardQris(mName, mNmid, 'JAKARTA', isDynamic, isDynamic ? total : 0);

        return {
          ...prev,
          waktu: safeWaktu,
          refNo: extracted.refNo || prev.refNo,
          merchantName: mName,
          nmid: mNmid,
          acquirer: extracted.acquirer || prev.acquirer,
          customerName: extracted.customerName || prev.customerName,
          nominal: nom,
          fee: fee,
          total: total,
          qrisPayload: newPayload,
        };
      });
      addToast('Bukti QRIS berhasil dipindai & dimasukkan ke form!', 'success');
    } else if (cat === 'toko') {
      if (extracted.items && Array.isArray(extracted.items) && extracted.items.length > 0) {
        const formattedItems = extracted.items.map((it: any, idx: number) => ({
          id: 'item_' + Date.now() + idx,
          name: it.name || 'Produk',
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
          subtotal: (Number(it.qty) || 1) * (Number(it.price) || 0),
        }));
        const total = Number(extracted.total) || formattedItems.reduce((a: number, c: any) => a + c.subtotal, 0);
        setTokoData((prev) => ({
          ...prev,
          waktu: safeWaktu,
          items: formattedItems,
          total,
          tunai: total,
          kembali: 0,
        }));
      }
      addToast('Bukti Belanja Toko berhasil dipindai & dimasukkan ke form!', 'success');
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
        onOpenSettingsModal={() => {
          setSettingsModalInitialTab('profil');
          setShowSettingsModal(true);
        }}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
        onOpenOnlineModal={() => setShowOnlineModal(true)}
        onOpenShareGuideModal={() => setShowShareGuideModal(true)}
        historyCount={history.length}
        bleConnected={bleConnected}
        bleDeviceName={bleDeviceName}
        isOnline={isOnline}
        serverStatus={serverStatus}
      />

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto p-3 flex-1">
        {/* PWA Install Banner for Android */}
        <PWAInstallButton variant="banner" />

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
        <ScreenshotScanBox
          onScanComplete={handleScanComplete}
          onOpenShareGuide={() => setShowShareGuideModal(true)}
          externalFileToProcess={sharedFileToProcess}
          onClearExternalFile={() => setSharedFileToProcess(null)}
        />

        {/* 4 Feature Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Feature Form */}
        {activeTab === 'token' && <TokenPlnForm data={plnData} onChange={setPlnData} />}
        {activeTab === 'transfer' && <TransferForm data={transferData} onChange={setTransferData} />}
        {activeTab === 'qris' && (
          <QrisForm
            data={qrisData}
            onChange={setQrisData}
            onOpenQrModal={() => setShowQrModal(true)}
            onNotify={addToast}
            masterQris={masterQris}
            onSaveMasterQris={handleSaveMasterQris}
            savedMerchants={qrisMerchants}
            activeMerchantId={activeQrisMerchantId}
            onSelectMerchant={handleSelectQrisMerchant}
            onOpenSettingsModal={() => {
              setSettingsModalInitialTab('qris');
              setShowSettingsModal(true);
            }}
            onPrintMerchantStandee={handlePrintMerchantStandee}
          />
        )}
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
          onOpenQrModal={() => setShowQrModal(true)}
        />
      </main>

      {/* QRIS Fullscreen Customer Display Modal */}
      <QrisDisplayModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        data={qrisData}
        settings={settings}
        onPrintReceipt={() => {
          const builder = buildEscPosReceipt('qris', qrisData, settings);
          printViaRawBt(builder.getBase64());
          handleRecordHistory();
          addToast('Membuka driver RawBT...', 'info');
        }}
      />

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
        onSave={(newSettings) => {
          handleUpdateSettings(newSettings);
          if (newSettings.masterQris) {
            handleSaveMasterQris(newSettings.masterQris);
          }
        }}
        onResetDefaults={() => {
          setSettings(DEFAULT_SETTINGS);
          handleSaveMasterQris(DEFAULT_MASTER_QRIS);
          setQrisMerchants(DEFAULT_QRIS_MERCHANTS);
          handleSelectQrisMerchant(DEFAULT_QRIS_MERCHANTS[0]);
        }}
        merchants={qrisMerchants}
        activeMerchantId={activeQrisMerchantId}
        onSelectMerchant={handleSelectQrisMerchant}
        onAddMerchant={handleAddQrisMerchant}
        onUpdateMerchant={handleUpdateQrisMerchant}
        onDeleteMerchant={handleDeleteQrisMerchant}
        onPrintMerchantStandee={handlePrintMerchantStandee}
        onPrintAllStandees={handlePrintAllStandees}
        initialTab={settingsModalInitialTab}
        onNotify={addToast}
      />

      <OnlineShareModal
        isOpen={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        isOnline={isOnline}
        serverStatus={serverStatus}
        latency={latency}
        onRefreshHealth={checkNow}
      />

      <ShareGuideModal
        isOpen={showShareGuideModal}
        onClose={() => setShowShareGuideModal(false)}
        onSelectFile={(file) => setSharedFileToProcess(file)}
        onOpenInstallModal={() => {
          addToast('Silakan ketuk tombol Pasang App di bagian atas untuk menginstal di HP Android', 'info');
        }}
        isInstalled={typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches}
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
