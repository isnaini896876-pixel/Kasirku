export type TabType = 'token' | 'transfer' | 'qris' | 'toko';

export interface PlnTokenData {
  waktu: string;
  sn: string;
  idpel: string;
  nama: string;
  tarifDaya: string;
  kwh: string;
  token: string;
  nominal: number;
  adminPln: number;
  adminKonter: number;
  statusAdminPln: boolean;
  statusAdminKonter: boolean;
  total: number;
  stroomKwh?: string;
  materai?: number;
  ppn?: number;
  ppj?: number;
  angsuran?: number;
}

export interface SenderAccountCategory {
  id: string;
  categoryName: string; // e.g. "Rekening Utama Toko", "Kasir Kas", "DANA Bisnis", "BRI BRILink"
  bank: string;         // e.g. "BCA", "BRI", "MANDIRI", "DANA"
  accountNumber: string;// e.g. "8291029381"
  accountHolder?: string;// e.g. "KONTER BERKAH"
}

export interface TransferData {
  waktu: string;
  refNo: string;
  bankPengirim: string;
  namaPengirim?: string;
  bankTujuan: string;
  rekeningPengirim: string;
  sensorRekening: boolean;
  tampilkanRekeningPengirim: boolean; // Atur hidup dan matikan rekening asal di struk & form
  kategoriPengirim?: string;          // Kategori rekening pengirim terpilih
  rekeningTujuan: string;
  namaPenerima: string;
  nominal: number;
  adminBank: number;
  adminKonter: number;
  statusAdminBank: boolean;
  statusAdminKonter: boolean;
  total: number;
  status: string; // 'BERHASIL' | 'SUKSES' | 'LUNAS'
  catatan: string;
  tampilkanCatatan: boolean;          // Atur hidup dan matikan tulisan berita opsional di struk
}

export interface QrisData {
  waktu: string;
  refNo: string;
  merchantName: string;
  nmid: string;
  acquirer: string;
  customerName: string;
  nominal: number;
  fee: number;
  total: number;
  status: string;
  qrisType: 'dinamis' | 'statis';
  qrisPayload: string;
  printQrOnReceipt: boolean;
  city?: string;
}

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface TokoData {
  waktu: string;
  noStruk: string;
  kasir: string;
  customerName: string;
  items: CartItem[];
  diskon: number;
  biayaLain: number;
  total: number;
  tunai: number;
  kembali: number;
  metodeBayar: string; // 'TUNAI' | 'TRANSFER' | 'QRIS'
}

export interface MasterQrisConfig {
  merchantName: string;
  nmid: string;
  acquirer: string;
  city: string;
  qrisPayload: string;
  isConfigured: boolean;
  savedAt?: string;
}

export interface QrisMerchantAccount {
  id: string;
  merchantName: string;
  nmid: string;
  acquirer: string;
  city: string;
  qrisPayload: string;
  isDefault?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
  fontSize: 'sm' | 'md' | 'lg';
  soundEnabled: boolean;
  autoAnnounceOnPrint: boolean;
  showBarcode: boolean;
  defaultQrisPayload?: string;
  defaultNmid?: string;
  masterQris?: MasterQrisConfig;
  qrisMerchants?: QrisMerchantAccount[];
  activeQrisMerchantId?: string;
}

export interface ReceiptHistoryItem {
  id: string;
  timestamp: string;
  category: TabType;
  title: string;
  customer: string;
  nominal: number;
  total: number;
  data: PlnTokenData | TransferData | QrisData | TokoData;
}
