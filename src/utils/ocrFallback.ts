import { formatToken20 } from './formatters';

export interface ExtractedReceiptData {
  category: 'token' | 'transfer' | 'qris' | 'toko';
  waktu?: string;
  refNo?: string;
  // PLN
  idpel?: string;
  namaPelanggan?: string;
  tarifDaya?: string;
  kwh?: string;
  tokenNumber?: string;
  // Transfer
  bankPengirim?: string;
  bankTujuan?: string;
  rekeningTujuan?: string;
  namaPenerima?: string;
  // Amounts
  nominal?: number;
  adminBank?: number;
  adminKonter?: number;
  total?: number;
  rawText?: string;
}

export function parseLocalReceiptText(text: string): ExtractedReceiptData {
  const clean = text.replace(/\r/g, '');
  const lower = clean.toLowerCase();

  // Detect category
  let category: 'token' | 'transfer' | 'qris' | 'toko' = 'transfer';
  if (lower.includes('token') || lower.includes('stroom') || lower.includes('pln') || lower.includes('idpel') || lower.includes('kwh')) {
    category = 'token';
  } else if (lower.includes('qris') || lower.includes('nmid') || lower.includes('merchant')) {
    category = 'qris';
  } else if (lower.includes('kasir') || lower.includes('item') || lower.includes('kembali') || lower.includes('belanja')) {
    category = 'toko';
  }

  const result: ExtractedReceiptData = {
    category,
    rawText: text,
  };

  // Find 20 digit token (PLN): XXXX-XXXX-XXXX-XXXX-XXXX or 20 digits
  const tokenMatch = clean.match(/(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})/);
  if (tokenMatch) {
    result.tokenNumber = formatToken20(tokenMatch[1]);
    result.category = 'token';
  }

  // Find IDPEL / No Meter (11 to 12 digits)
  const idpelMatch = clean.match(/(?:idpel|no\.?\s*meter|id\s*pelanggan)[:\s]*([0-9]{11,12})/i) ||
                     clean.match(/\b([1-9][0-9]{10,11})\b/);
  if (idpelMatch) {
    result.idpel = idpelMatch[1];
  }

  // Find Tarif / Daya (e.g. R1M / 900 VA, R1 / 1300 VA)
  const tarifMatch = clean.match(/(?:tarif\/daya|tarif|daya)[:\s]*([a-z0-9/ ]+va)/i) ||
                     clean.match(/\b([rbist][0-9][a-z]?\s*[\/-]?\s*[0-9]+(?:\s*va)?)\b/i);
  if (tarifMatch) {
    result.tarifDaya = tarifMatch[1].trim().toUpperCase();
  }

  // Find kWh (e.g. 33.1 kWh, 33,1 kwh)
  const kwhMatch = clean.match(/([0-9]+[.,][0-9]+\s*kwh)/i);
  if (kwhMatch) {
    result.kwh = kwhMatch[1].trim();
  }

  // Find Ref / SN
  const refMatch = clean.match(/(?:no\.?\s*ref(?:erensi)?|ref\s*no|sn|kode\s*transaksi)[:\s]*([a-zA-Z0-9]{8,25})/i);
  if (refMatch) {
    result.refNo = refMatch[1].trim();
  }

  // Find Bank Names
  const banks = ['BCA', 'BRI', 'MANDIRI', 'BNI', 'BSI', 'CIMB', 'JAGO', 'SEABANK', 'DANA', 'OVO', 'GOPAY', 'SHOPEEPAY'];
  for (const b of banks) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(clean)) {
      if (!result.bankTujuan) {
        result.bankTujuan = b;
      }
    }
  }

  // Extract Indonesian Rupiah amounts
  const rpMatches = clean.match(/(?:rp\.?|total|nominal|bayar|jumlah)[:\s]*([0-9]{1,3}(?:\.[0-9]{3})+)/gi);
  if (rpMatches && rpMatches.length > 0) {
    const numbers = rpMatches.map((m) => {
      const numStr = m.replace(/\D/g, '');
      return parseInt(numStr, 10);
    }).filter((n) => !isNaN(n) && n > 0);

    if (numbers.length > 0) {
      result.nominal = numbers[0];
      result.total = numbers[numbers.length - 1] || numbers[0];
    }
  }

  // Extract Customer Name
  const nameMatch = clean.match(/(?:nama|penerima|customer)[:\s]*([a-zA-Z\s]{3,30})/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim().replace(/\n.*$/, '');
    if (rawName && !/nominal|admin|total|rupiah/i.test(rawName)) {
      result.namaPelanggan = rawName.toUpperCase();
      result.namaPenerima = rawName.toUpperCase();
    }
  }

  return result;
}
