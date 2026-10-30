import { StoreSettings, TabType, PlnTokenData, TransferData, QrisData, TokoData, QrisMerchantAccount } from '../types';
import { formatRupiah, maskAccount } from './formatters';

// Common ESC/POS BLE Service & Characteristic UUIDs
const BLE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // PosPrinter
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common Chinese OEM (RPP02N, GOOJPRT)
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Wechat POS
];

// Web Bluetooth ambient type declarations
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

export interface BleConnectionState {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  deviceName: string;
  isConnected: boolean;
}

export let globalBleState: BleConnectionState = {
  device: null,
  server: null,
  characteristic: null,
  deviceName: 'Kompatibel Semua Merek',
  isConnected: false,
};

// Check if Web Bluetooth is supported in current browser
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export class BlePermissionError extends Error {
  isSecurityBlocked: boolean;
  constructor(message: string) {
    super(message);
    this.name = 'BlePermissionError';
    this.isSecurityBlocked = true;
  }
}

// Connect to Bluetooth BLE Printer
export async function connectBlePrinter(
  onStatusChange?: (state: BleConnectionState) => void
): Promise<BleConnectionState> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth tidak didukung pada browser ini. Disarankan gunakan Chrome Android atau aplikasi RawBT.');
  }

  try {
    const navBt = (navigator as any).bluetooth;
    const device: BluetoothDevice = await navBt.requestDevice({
      filters: [
        { services: [BLE_SERVICES[0]] },
        { services: [BLE_SERVICES[1]] },
        { services: [BLE_SERVICES[2]] },
        { services: [BLE_SERVICES[3]] },
        { services: [BLE_SERVICES[4]] },
      ],
      optionalServices: BLE_SERVICES,
    }).catch(async (e: any) => {
      // If error is security/permission policy, rethrow immediately
      const errMsg = String(e?.message || e || '');
      if (e?.name === 'SecurityError' || errMsg.includes('permissions policy') || errMsg.includes('disallowed')) {
        throw e;
      }
      // Fallback: accept all devices if filter missed specific vendor ID
      return await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_SERVICES,
      });
    });

    if (!device) {
      throw new Error('Tidak ada perangkat Bluetooth yang dipilih.');
    }

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('Gagal menghubungkan ke GATT Server printer.');
    }

    let targetCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

    // Discover supported service
    for (const serviceUuid of BLE_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            targetCharacteristic = c;
            break;
          }
        }
        if (targetCharacteristic) break;
      } catch {
        // continue search
      }
    }

    if (!targetCharacteristic) {
      throw new Error('Karakteristik ESC/POS write tidak ditemukan pada perangkat Bluetooth ini.');
    }

    globalBleState = {
      device,
      server,
      characteristic: targetCharacteristic,
      deviceName: device.name || 'Printer Thermal BLE',
      isConnected: true,
    };

    device.addEventListener('gattserverdisconnected', () => {
      globalBleState.isConnected = false;
      if (onStatusChange) onStatusChange({ ...globalBleState });
    });

    if (onStatusChange) onStatusChange({ ...globalBleState });
    return globalBleState;
  } catch (error: any) {
    const errorStr = String(error?.message || error || '');
    const isSecurityError =
      error?.name === 'SecurityError' ||
      errorStr.includes('permissions policy') ||
      errorStr.includes('disallowed by permissions policy');

    if (isSecurityError) {
      throw new BlePermissionError(
        'Akses Web Bluetooth langsung dibatasi oleh kebijakan keamanan browser (Permissions Policy iframe). Silakan gunakan metode universal "Cetak ke Printer Thermal (RawBT)" atau "Cetak Browser/PDF".'
      );
    }

    if (error?.name === 'NotFoundError') {
      // User dismissed dialog
      throw error;
    }

    throw error;
  }
}

// Disconnect BLE
export function disconnectBlePrinter(): void {
  if (globalBleState.server && globalBleState.server.connected) {
    globalBleState.server.disconnect();
  }
  globalBleState.isConnected = false;
}

// Generate ESC/POS byte commands
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  init() {
    this.buffer.push(0x1b, 0x40); // ESC @ Initialize
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean = true) {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean = true) {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00); // GS ! n (double width & height)
    return this;
  }

  doubleHeight(enable: boolean = true) {
    this.buffer.push(0x1d, 0x21, enable ? 0x01 : 0x00);
    return this;
  }

  text(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = '') {
    this.text(str + '\n');
    return this;
  }

  divider(cols: number = 32, char: string = '-') {
    this.line(char.repeat(cols));
    return this;
  }

  twoColumn(left: string, right: string, cols: number = 32) {
    const maxLeft = cols - right.length - 1;
    let safeLeft = left;
    if (safeLeft.length > maxLeft) {
      safeLeft = safeLeft.slice(0, maxLeft);
    }
    const spaces = Math.max(1, cols - safeLeft.length - right.length);
    this.line(safeLeft + ' '.repeat(spaces) + right);
    return this;
  }

  qrCode(content: string, size: number = 6) {
    if (!content) return this;
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(content);
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Model: GS ( k 04 00 31 41 32 00
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // 2. Size: GS ( k 03 00 31 43 size
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(Math.max(size, 1), 16));
    // 3. Error correction level M (49): GS ( k 03 00 31 45 49
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // 4. Store data: GS ( k pL pH 31 50 30 d1...dk
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < dataBytes.length; i++) {
      this.buffer.push(dataBytes[i]);
    }
    // 5. Print: GS ( k 03 00 31 51 30
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  feed(lines: number = 3) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x03); // GS V A 3 (partial cut)
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  getBase64(): string {
    const uint8 = this.getBytes();
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
}

// Generate RawBT URL scheme or Intent
export function createRawBtUrl(base64Data: string): string {
  // Try Android Chrome Intent URI (most reliable)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    return `intent:#Intent;scheme=rawbt;package=ru.a4024.rawbtprinter;S.data=${encodeURIComponent(base64Data)};end`;
  }
  return `rawbt:data:base64,${base64Data}`;
}

// Execute RawBT Print
export function printViaRawBt(base64Data: string): void {
  const url = createRawBtUrl(base64Data);
  // Create an invisible link and trigger click
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 300);
}

// Share text directly to mobile Bluetooth printer app
export async function shareToPrinterApp(plainText: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Cetak Struk Thermal',
        text: plainText,
      });
      return true;
    } catch {
      // User cancelled or unsupported
      return false;
    }
  }
  return false;
}

// Send ESC/POS commands directly over BLE in chunks of 512 bytes
export async function printViaBle(bytes: Uint8Array): Promise<void> {
  if (!globalBleState.characteristic) {
    throw new Error('Printer Bluetooth belum terhubung. Silakan tekan tombol "Hubungkan BLE" terlebih dahulu.');
  }

  const chunkSize = 120; // Safe MTU size for cheap Bluetooth thermal printers
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.slice(offset, offset + chunkSize);
    if (globalBleState.characteristic.properties.writeWithoutResponse && globalBleState.characteristic.writeValueWithoutResponse) {
      await globalBleState.characteristic.writeValueWithoutResponse(chunk);
    } else {
      await globalBleState.characteristic.writeValue(chunk);
    }
    // Small delay to prevent printer buffer overflow
    await new Promise((r) => setTimeout(r, 20));
  }
}

// Build ESC/POS bytes from state
export function buildEscPosReceipt(
  type: TabType,
  data: PlnTokenData | TransferData | QrisData | TokoData,
  settings: StoreSettings
): EscPosBuilder {
  const cols = settings.paperWidth === '80mm' ? 48 : 32;
  const builder = new EscPosBuilder();

  // Header
  builder.alignCenter();
  builder.bold(true);
  builder.line(settings.storeName.toUpperCase());
  builder.bold(false);
  if (settings.tagline) builder.line(settings.tagline);
  if (settings.address) builder.line(settings.address);
  if (settings.phone) builder.line(`Telp/WA: ${settings.phone}`);
  builder.divider(cols, '=');

  builder.alignLeft();

  if (type === 'token') {
    const pln = data as PlnTokenData;
    builder.alignCenter().bold(true).line('STRUK PEMBELIAN TOKEN LISTRIK').bold(false).alignLeft();
    builder.twoColumn('WAKTU', pln.waktu || '-', cols);
    builder.twoColumn('NO. REF/SN', pln.sn || '-', cols);
    builder.twoColumn('NO. METER/ID', pln.idpel || '-', cols);
    builder.twoColumn('NAMA', (pln.nama || '-').toUpperCase(), cols);
    builder.twoColumn('TARIF/DAYA', pln.tarifDaya || '-', cols);
    builder.twoColumn('JML KWH', pln.kwh || '-', cols);

    builder.divider(cols, '-');
    builder.alignCenter().bold(true).line('STROOM / KODE TOKEN LISTRIK:');
    builder.doubleSize(true);
    builder.line(pln.token || '0000-0000-0000-0000-0000');
    builder.doubleSize(false);
    builder.line('(20 DIGIT NOMOR TOKEN)');
    builder.bold(false).alignLeft();
    builder.divider(cols, '-');

    builder.twoColumn('NOMINAL TOKEN', formatRupiah(pln.nominal), cols);
    if (pln.statusAdminPln && pln.adminPln > 0) {
      builder.twoColumn('ADMIN PLN/BANK', formatRupiah(pln.adminPln), cols);
    }
    if (pln.statusAdminKonter && pln.adminKonter > 0) {
      builder.twoColumn('JASA KONTER/TOKO', formatRupiah(pln.adminKonter), cols);
    }
    builder.divider(cols, '=');
    builder.bold(true);
    builder.twoColumn('TOTAL BAYAR', formatRupiah(pln.total), cols);
    builder.bold(false);
  } else if (type === 'transfer') {
    const tf = data as TransferData;
    builder.alignCenter().bold(true).line('BUKTI TRANSFER DANA').bold(false).alignLeft();
    builder.twoColumn('STATUS', tf.status || 'BERHASIL', cols);
    builder.twoColumn('WAKTU', tf.waktu || '-', cols);
    builder.twoColumn('NO. REFERENSI', tf.refNo || '-', cols);
    builder.divider(cols, '-');

    // Sumber Dana (bisa diatur hidup/mati)
    if (tf.tampilkanRekeningPengirim !== false) {
      const labelSumber = tf.kategoriPengirim ? `SUMBER (${tf.kategoriPengirim})` : 'SUMBER DANA';
      builder.twoColumn(labelSumber, tf.bankPengirim || '-', cols);
      if (tf.rekeningPengirim) {
        builder.twoColumn('NO. REKENING', tf.sensorRekening ? maskAccount(tf.rekeningPengirim) : tf.rekeningPengirim, cols);
      }
      if (tf.namaPengirim) {
        builder.twoColumn('PENGIRIM', tf.namaPengirim.toUpperCase(), cols);
      }
    }

    builder.twoColumn('TUJUAN', tf.bankTujuan || '-', cols);
    builder.twoColumn('NO. REK/HP', tf.rekeningTujuan || '-', cols);
    builder.twoColumn('PENERIMA', (tf.namaPenerima || '-').toUpperCase(), cols);

    // Tulisan Berita Opsional (bisa diatur hidup/mati)
    if (tf.tampilkanCatatan !== false && tf.catatan) {
      builder.twoColumn('BERITA', tf.catatan, cols);
    }

    builder.divider(cols, '-');
    builder.twoColumn('NOMINAL TRF', formatRupiah(tf.nominal), cols);
    if (tf.statusAdminBank && tf.adminBank > 0) {
      builder.twoColumn('ADMIN BANK', formatRupiah(tf.adminBank), cols);
    }
    if (tf.statusAdminKonter && tf.adminKonter > 0) {
      builder.twoColumn('BIAYA LAYANAN', formatRupiah(tf.adminKonter), cols);
    }
    builder.divider(cols, '=');
    builder.bold(true);
    builder.twoColumn('TOTAL BAYAR', formatRupiah(tf.total), cols);
    builder.bold(false);
  } else if (type === 'qris') {
    const qris = data as QrisData;
    builder.alignCenter().bold(true).line('BUKTI PEMBAYARAN QRIS').bold(false).alignLeft();
    builder.twoColumn('STATUS', qris.status || 'SUKSES', cols);
    builder.twoColumn('TIPE QRIS', qris.qrisType === 'dinamis' ? 'DINAMIS (PAS)' : 'STATIS', cols);
    builder.twoColumn('WAKTU', qris.waktu || '-', cols);
    builder.twoColumn('MERCHANT', qris.merchantName || settings.storeName, cols);
    if (qris.nmid) builder.twoColumn('NMID', qris.nmid, cols);
    builder.twoColumn('ACQUIRER', qris.acquirer || 'QRIS', cols);
    builder.twoColumn('NO. REF / RRN', qris.refNo || '-', cols);
    if (qris.customerName) builder.twoColumn('CUSTOMER', qris.customerName, cols);
    builder.divider(cols, '-');
    builder.twoColumn('NOMINAL', formatRupiah(qris.nominal), cols);
    if (qris.fee > 0) {
      builder.twoColumn('BIAYA ADMIN', formatRupiah(qris.fee), cols);
    }
    builder.divider(cols, '=');
    builder.bold(true);
    builder.twoColumn('TOTAL BAYAR', formatRupiah(qris.total), cols);
    builder.bold(false);

    if (qris.printQrOnReceipt && qris.qrisPayload) {
      builder.feed(1);
      builder.alignCenter();
      builder.qrCode(qris.qrisPayload, 6);
      builder.feed(1);
      builder.bold(true).line(qris.qrisType === 'dinamis' ? '[ SCAN UNTUK BAYAR PAS ]' : '[ SCAN QRIS BEBAS ]').bold(false);
      builder.alignLeft();
    }
  } else if (type === 'toko') {
    const toko = data as TokoData;
    builder.alignCenter().bold(true).line('STRUK PENJUALAN TOKO').bold(false).alignLeft();
    builder.twoColumn('NO. STRUK', toko.noStruk || '-', cols);
    builder.twoColumn('WAKTU', toko.waktu || '-', cols);
    if (toko.kasir) builder.twoColumn('KASIR', toko.kasir, cols);
    if (toko.customerName) builder.twoColumn('PELANGGAN', toko.customerName, cols);
    builder.divider(cols, '-');

    toko.items.forEach((item) => {
      builder.line(item.name);
      builder.twoColumn(`  ${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal), cols);
    });

    builder.divider(cols, '-');
    const subtotal = toko.items.reduce((acc, curr) => acc + curr.subtotal, 0);
    builder.twoColumn('SUBTOTAL', formatRupiah(subtotal), cols);
    if (toko.diskon > 0) {
      builder.twoColumn('DISKON', `-${formatRupiah(toko.diskon)}`, cols);
    }
    if (toko.biayaLain > 0) {
      builder.twoColumn('BIAYA LAIN', formatRupiah(toko.biayaLain), cols);
    }
    builder.divider(cols, '=');
    builder.bold(true);
    builder.twoColumn('TOTAL', formatRupiah(toko.total), cols);
    builder.bold(false);
    builder.twoColumn('BAYAR (TUNAI)', formatRupiah(toko.tunai), cols);
    builder.twoColumn('KEMBALIAN', formatRupiah(toko.kembali), cols);
  }

  // Footer
  builder.divider(cols, '=');
  builder.alignCenter();
  if (settings.footerMessage) {
    builder.line(settings.footerMessage);
  } else {
    builder.line('Terima kasih atas kunjungan Anda');
    builder.line('Struk ini bukti pembayaran yang sah');
  }
  builder.feed(3);
  builder.cut();

  return builder;
}

// Generate plain text receipt for WhatsApp sharing
export function buildWhatsAppTextReceipt(
  type: TabType,
  data: PlnTokenData | TransferData | QrisData | TokoData,
  settings: StoreSettings
): string {
  const lines: string[] = [];
  lines.push(`*${settings.storeName.toUpperCase()}*`);
  if (settings.tagline) lines.push(`_${settings.tagline}_`);
  if (settings.address) lines.push(settings.address);
  if (settings.phone) lines.push(`WA: ${settings.phone}`);
  lines.push('================================');

  if (type === 'token') {
    const pln = data as PlnTokenData;
    lines.push('*STRUK PEMBELIAN TOKEN LISTRIK PLN*');
    lines.push(`Waktu: ${pln.waktu}`);
    lines.push(`No. Ref: ${pln.sn}`);
    lines.push(`IDPEL/Meter: ${pln.idpel}`);
    lines.push(`Nama: ${pln.nama}`);
    lines.push(`Tarif/Daya: ${pln.tarifDaya}`);
    lines.push(`Jumlah kWh: ${pln.kwh}`);
    lines.push('--------------------------------');
    lines.push('⚡ *NOMOR TOKEN LISTRIK (20 DIGIT):*');
    lines.push(`\`\`\`${pln.token}\`\`\``);
    lines.push('--------------------------------');
    lines.push(`Nominal: ${formatRupiah(pln.nominal)}`);
    if (pln.statusAdminPln && pln.adminPln > 0) lines.push(`Admin PLN: ${formatRupiah(pln.adminPln)}`);
    if (pln.statusAdminKonter && pln.adminKonter > 0) lines.push(`Jasa Konter: ${formatRupiah(pln.adminKonter)}`);
    lines.push(`*TOTAL BAYAR: ${formatRupiah(pln.total)}*`);
  } else if (type === 'transfer') {
    const tf = data as TransferData;
    lines.push('*BUKTI TRANSFER DANA*');
    lines.push(`Status: *${tf.status}*`);
    lines.push(`Waktu: ${tf.waktu}`);
    lines.push(`No. Ref: ${tf.refNo}`);
    if (tf.tampilkanRekeningPengirim !== false) {
      const ketKategori = tf.kategoriPengirim ? ` (${tf.kategoriPengirim})` : '';
      const rek = tf.sensorRekening ? maskAccount(tf.rekeningPengirim) : tf.rekeningPengirim;
      lines.push(`Dari: ${tf.bankPengirim}${ketKategori}${rek ? ` - ${rek}` : ''}`);
      if (tf.namaPengirim) lines.push(`Pengirim: ${tf.namaPengirim}`);
    }
    lines.push(`Tujuan: ${tf.bankTujuan} - ${tf.rekeningTujuan}`);
    lines.push(`Penerima: *${tf.namaPenerima}*`);
    if (tf.tampilkanCatatan !== false && tf.catatan) lines.push(`Berita: ${tf.catatan}`);
    lines.push('--------------------------------');
    lines.push(`Nominal: ${formatRupiah(tf.nominal)}`);
    if (tf.statusAdminBank && tf.adminBank > 0) lines.push(`Biaya Admin: ${formatRupiah(tf.adminBank)}`);
    if (tf.statusAdminKonter && tf.adminKonter > 0) lines.push(`Jasa Konter: ${formatRupiah(tf.adminKonter)}`);
    lines.push(`*TOTAL: ${formatRupiah(tf.total)}*`);
  } else if (type === 'qris') {
    const qris = data as QrisData;
    lines.push('*BUKTI PEMBAYARAN QRIS*');
    lines.push(`Status: *${qris.status || 'BERHASIL'}*`);
    lines.push(`Tipe QRIS: *${qris.qrisType === 'dinamis' ? 'DINAMIS (Nominal Terkunci)' : 'STATIS (Nominal Bebas)'}*`);
    lines.push(`Waktu: ${qris.waktu}`);
    lines.push(`Merchant: ${qris.merchantName}`);
    if (qris.nmid) lines.push(`NMID: ${qris.nmid}`);
    lines.push(`Acquirer: ${qris.acquirer}`);
    lines.push(`RRN/Ref: ${qris.refNo}`);
    if (qris.customerName) lines.push(`Pelanggan: ${qris.customerName}`);
    lines.push('--------------------------------');
    lines.push(`Nominal: ${formatRupiah(qris.nominal)}`);
    if (qris.fee > 0) lines.push(`Biaya: ${formatRupiah(qris.fee)}`);
    lines.push(`*TOTAL: ${formatRupiah(qris.total)}*`);
  } else if (type === 'toko') {
    const toko = data as TokoData;
    lines.push('*STRUK BELANJA TOKO*');
    lines.push(`No: ${toko.noStruk} | Waktu: ${toko.waktu}`);
    if (toko.kasir) lines.push(`Kasir: ${toko.kasir}`);
    lines.push('--------------------------------');
    toko.items.forEach((item) => {
      lines.push(`${item.name}`);
      lines.push(`  ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}`);
    });
    lines.push('--------------------------------');
    lines.push(`*TOTAL: ${formatRupiah(toko.total)}*`);
    lines.push(`Bayar Tunai: ${formatRupiah(toko.tunai)}`);
    lines.push(`Kembalian: ${formatRupiah(toko.kembali)}`);
  }

  lines.push('================================');
  lines.push(settings.footerMessage || 'Terima kasih atas kepercayaan Anda!');
  return lines.join('\n');
}

// Build ESC/POS bytes for a single QRIS merchant standee card
export function buildQrisStandeeReceipt(
  merchant: QrisMerchantAccount,
  settings: StoreSettings
): EscPosBuilder {
  const cols = settings.paperWidth === '80mm' ? 48 : 32;
  const builder = new EscPosBuilder();

  // Standee Header
  builder.alignCenter();
  builder.bold(true);
  builder.line('================================'.slice(0, cols));
  builder.line('QRIS PEMBAYARAN RESMI');
  builder.bold(false);
  builder.line('STAND SCAN MEJA KASIR');
  builder.divider(cols, '=');

  // Merchant Information
  builder.feed(1);
  builder.bold(true);
  builder.line(merchant.merchantName.toUpperCase());
  builder.bold(false);
  if (merchant.notes) {
    builder.line(`[ ${merchant.notes} ]`);
  }
  builder.feed(1);

  // Big QR Code
  // Size 6 for 58mm, size 8 for 80mm
  const qrSize = settings.paperWidth === '80mm' ? 8 : 6;
  builder.qrCode(merchant.qrisPayload, qrSize);
  builder.feed(1);

  // Scan Notice
  builder.bold(true);
  builder.line('[ SCAN UNTUK BAYAR ]');
  builder.bold(false);
  builder.feed(1);

  // Details
  builder.alignLeft();
  builder.divider(cols, '-');
  builder.twoColumn('NMID', merchant.nmid || '-', cols);
  builder.twoColumn('ACQUIRER', merchant.acquirer || 'QRIS NASIONAL', cols);
  if (merchant.city) {
    builder.twoColumn('KOTA', merchant.city, cols);
  }
  builder.twoColumn('TIPE QRIS', 'STATIS (NOMINAL BEBAS)', cols);
  builder.divider(cols, '-');

  // Accepted payment methods
  builder.alignCenter();
  builder.line('MENERIMA SEMUA PEMBAYARAN:');
  builder.line('BCA, Mandiri, BRI, BNI, BSI');
  builder.line('DANA, OVO, GoPay, ShopeePay, LinkAja');
  builder.line('& Seluruh Aplikasi Mobile Banking');
  builder.divider(cols, '=');
  builder.line(settings.storeName.toUpperCase());
  if (settings.phone) {
    builder.line(`WA/CS: ${settings.phone}`);
  }
  builder.feed(3);
  builder.cut();

  return builder;
}

// Build ESC/POS bytes for all saved QRIS merchant standees in one batch print job
export function buildAllQrisStandeesReceipt(
  merchants: QrisMerchantAccount[],
  settings: StoreSettings
): EscPosBuilder {
  const cols = settings.paperWidth === '80mm' ? 48 : 32;
  const builder = new EscPosBuilder();

  // Banner intro
  builder.alignCenter();
  builder.bold(true);
  builder.line('================================'.slice(0, cols));
  builder.line('BATCH CETAK BARCODE QRIS TOKO');
  builder.line(`TOTAL: ${merchants.length} AKUN MERCHANT`);
  builder.bold(false);
  builder.line(settings.storeName.toUpperCase());
  builder.line('================================'.slice(0, cols));
  builder.feed(1);

  merchants.forEach((m, idx) => {
    builder.alignCenter();
    builder.divider(cols, '*');
    builder.bold(true);
    builder.line(`[ AKUN QRIS #${idx + 1} DARI ${merchants.length} ]`);
    builder.line(m.merchantName.toUpperCase());
    builder.bold(false);
    if (m.notes) builder.line(`[ ${m.notes} ]`);
    builder.feed(1);

    const qrSize = settings.paperWidth === '80mm' ? 8 : 6;
    builder.qrCode(m.qrisPayload, qrSize);
    builder.feed(1);

    builder.bold(true);
    builder.line('[ SCAN UNTUK BAYAR ]');
    builder.bold(false);

    builder.alignLeft();
    builder.divider(cols, '-');
    builder.twoColumn('NMID', m.nmid || '-', cols);
    builder.twoColumn('ACQUIRER', m.acquirer || 'QRIS NASIONAL', cols);
    if (m.city) builder.twoColumn('KOTA', m.city, cols);
    builder.divider(cols, '-');
    builder.feed(2);
  });

  builder.alignCenter();
  builder.divider(cols, '=');
  builder.bold(true);
  builder.line('SELESAI CETAK SEMUA QRIS');
  builder.bold(false);
  builder.line('Gunting garis pembatas untuk dipajang');
  builder.line('================================'.slice(0, cols));
  builder.feed(3);
  builder.cut();

  return builder;
}

// Plain text format for single standee card (for WhatsApp / sharing)
export function generateQrisStandeePlainText(
  merchant: QrisMerchantAccount,
  settings: StoreSettings
): string {
  const lines: string[] = [];
  lines.push('================================');
  lines.push('🏷️ *QRIS PEMBAYARAN RESMI*');
  lines.push(`*${merchant.merchantName.toUpperCase()}*`);
  if (merchant.notes) lines.push(`_${merchant.notes}_`);
  lines.push('================================');
  lines.push(`NMID     : ${merchant.nmid || '-'}`);
  lines.push(`Acquirer : ${merchant.acquirer || 'QRIS'}`);
  if (merchant.city) lines.push(`Kota     : ${merchant.city}`);
  lines.push('Tipe     : QRIS Statis Toko');
  lines.push('--------------------------------');
  lines.push('📲 *Kode Payload QRIS:*');
  lines.push(`\`\`\`${merchant.qrisPayload}\`\`\``);
  lines.push('--------------------------------');
  lines.push('Menerima Pembayaran:');
  lines.push('BCA, Mandiri, BRI, BNI, DANA, OVO, GoPay, ShopeePay & Semua Bank');
  lines.push('================================');
  lines.push(settings.storeName.toUpperCase());
  return lines.join('\n');
}

