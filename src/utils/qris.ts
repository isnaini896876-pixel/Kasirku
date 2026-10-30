/**
 * Indonesian QRIS (Quick Response Code Indonesian Standard) Engine
 * Compliant with Bank Indonesia & ASPI EMVCo Merchant-Presented Mode specifications
 */

export interface ParsedQrisInfo {
  version: string;
  isDynamic: boolean;
  qrisType: 'dinamis' | 'statis';
  merchantName: string;
  merchantCity: string;
  postalCode?: string;
  nmid?: string;
  acquirerName?: string;
  nominal?: number;
  currency: string;
  countryCode: string;
  crc: string;
  isValidCrc: boolean;
  rawPayload: string;
}

// Calculate CRC-16 CCITT (0xFFFF, 0x1021) as mandated by EMVCo / QRIS specs
export function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

// Parse QRIS TLV (Tag-Length-Value) String
export function parseQrisTlv(payload: string): { tags: Record<string, string>; order: string[] } {
  const tags: Record<string, string> = {};
  const order: string[] = [];
  let i = 0;

  while (i < payload.length - 4) {
    const tag = payload.substring(i, i + 2);
    const lengthStr = payload.substring(i + 2, i + 4);
    const len = parseInt(lengthStr, 10);

    if (isNaN(len) || len < 0 || i + 4 + len > payload.length) {
      break;
    }

    const value = payload.substring(i + 4, i + 4 + len);
    tags[tag] = value;
    order.push(tag);
    i += 4 + len;

    // Stop at CRC tag
    if (tag === '63') break;
  }

  return { tags, order };
}

// Helper to format a single TLV tag
function formatTlv(tag: string, value: string): string {
  const lenStr = String(value.length).padStart(2, '0');
  return `${tag}${lenStr}${value}`;
}

// Parse human readable fields from a raw QRIS string
export function analyzeQrisPayload(raw: string): ParsedQrisInfo {
  const clean = raw.trim();
  const { tags } = parseQrisTlv(clean);

  const initMethod = tags['01'] || '11';
  const isDynamic = initMethod === '12';
  const merchantName = tags['59'] || 'MERCHANT QRIS';
  const merchantCity = tags['60'] || 'INDONESIA';
  const postalCode = tags['61'];
  const currency = tags['53'] === '360' ? 'IDR' : tags['53'] || 'IDR';
  const countryCode = tags['58'] || 'ID';
  const nominal = tags['54'] ? parseInt(tags['54'], 10) : undefined;

  // Extract NMID from Tag 26-45 if present
  let nmid: string | undefined;
  let acquirerName: string | undefined;

  for (let t = 26; t <= 45; t++) {
    const tagStr = String(t).padStart(2, '0');
    if (tags[tagStr]) {
      const subVal = tags[tagStr];
      // Sub-tag lookup
      const nmidMatch = subVal.match(/ID[0-9]{11,15}/i);
      if (nmidMatch) nmid = nmidMatch[0].toUpperCase();

      if (/BCA/i.test(subVal)) acquirerName = 'BCA';
      else if (/BRI/i.test(subVal)) acquirerName = 'BRI';
      else if (/MANDIRI/i.test(subVal)) acquirerName = 'MANDIRI';
      else if (/BNI/i.test(subVal)) acquirerName = 'BNI';
      else if (/DANA/i.test(subVal)) acquirerName = 'DANA';
      else if (/GOPAY/i.test(subVal)) acquirerName = 'GOPAY';
      else if (/SHOPEE/i.test(subVal)) acquirerName = 'SHOPEEPAY';
      else if (/NOBU/i.test(subVal)) acquirerName = 'NOBU';
    }
  }

  if (!nmid && tags['51']) {
    const nmidMatch = tags['51'].match(/ID[0-9]{11,15}/i);
    if (nmidMatch) nmid = nmidMatch[0].toUpperCase();
  }

  // Validate CRC
  const crcTagIdx = clean.lastIndexOf('6304');
  let isValidCrc = false;
  let crc = '';
  if (crcTagIdx !== -1) {
    const dataWithoutCrc = clean.substring(0, crcTagIdx + 4);
    crc = clean.substring(crcTagIdx + 4, crcTagIdx + 8);
    const expectedCrc = calculateCrc16(dataWithoutCrc);
    isValidCrc = crc.toUpperCase() === expectedCrc.toUpperCase();
  }

  return {
    version: tags['00'] || '01',
    isDynamic,
    qrisType: isDynamic ? 'dinamis' : 'statis',
    merchantName,
    merchantCity,
    postalCode,
    nmid,
    acquirerName: acquirerName || 'QRIS NASIONAL',
    nominal,
    currency,
    countryCode,
    crc,
    isValidCrc,
    rawPayload: clean,
  };
}

// Convert any static or base QRIS into a Dynamic QRIS with an exact amount!
export function convertToDynamicQris(
  basePayload: string,
  nominal: number,
  refNumber?: string
): string {
  let clean = basePayload.trim();

  // Strip existing CRC if present
  const crcIdx = clean.lastIndexOf('6304');
  if (crcIdx !== -1) {
    clean = clean.substring(0, crcIdx);
  }

  const { tags, order } = parseQrisTlv(clean);

  // Set Tag 01 to '12' (Dynamic QRIS)
  tags['01'] = '12';

  // Set Tag 54 to exact transaction amount
  tags['54'] = String(Math.floor(nominal));

  // If Reference number provided, update / set Tag 62 (Additional Data)
  if (refNumber) {
    const cleanRef = refNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
    // Sub-tag 01: Bill Number / Invoice
    const sub01 = formatTlv('01', cleanRef);
    tags['62'] = sub01;
    if (!order.includes('62')) {
      order.push('62');
    }
  }

  // Ensure Tag 54 is included in order
  if (!order.includes('54')) {
    // Insert after Tag 53 (Currency) or before Tag 58
    const idx53 = order.indexOf('53');
    if (idx53 !== -1) {
      order.splice(idx53 + 1, 0, '54');
    } else {
      order.push('54');
    }
  }

  // Rebuild payload without CRC
  let rebuilt = '';
  for (const tag of order) {
    if (tag === '63') continue;
    if (tags[tag] !== undefined) {
      rebuilt += formatTlv(tag, tags[tag]);
    }
  }

  // Append Tag 63 header and calculate CRC
  rebuilt += '6304';
  const crc = calculateCrc16(rebuilt);
  return `${rebuilt}${crc}`;
}

// Convert any QRIS into a Static QRIS (No pre-set amount, customer inputs amount)
export function convertToStaticQris(basePayload: string): string {
  let clean = basePayload.trim();

  const crcIdx = clean.lastIndexOf('6304');
  if (crcIdx !== -1) {
    clean = clean.substring(0, crcIdx);
  }

  const { tags, order } = parseQrisTlv(clean);

  // Set Tag 01 to '11' (Static QRIS)
  tags['01'] = '11';

  // Remove Tag 54 (Amount)
  delete tags['54'];
  const newOrder = order.filter((t) => t !== '54' && t !== '63');

  // Rebuild
  let rebuilt = '';
  for (const tag of newOrder) {
    if (tags[tag] !== undefined) {
      rebuilt += formatTlv(tag, tags[tag]);
    }
  }

  rebuilt += '6304';
  const crc = calculateCrc16(rebuilt);
  return `${rebuilt}${crc}`;
}

// Generate standard Indonesian QRIS payload template
export function generateStandardQris(
  merchantName: string,
  nmid: string = 'ID1020039281921',
  city: string = 'JAKARTA',
  isDynamic: boolean = false,
  nominal: number = 0
): string {
  const safeName = (merchantName || 'KONTER CELL').toUpperCase().slice(0, 25);
  const safeCity = (city || 'JAKARTA').toUpperCase().slice(0, 15);
  const safeNmid = (nmid || 'ID1020039281921').replace(/[^a-zA-Z0-9]/g, '');

  // Tag 26: Merchant Account Information
  // 00: Reverse domain 'ID.CO.QRIS.WWW'
  // 01: NMID
  // 02: Criteria 'UMI' (Usaha Mikro)
  const tag26Sub =
    formatTlv('00', 'ID.CO.QRIS.WWW') +
    formatTlv('01', safeNmid) +
    formatTlv('02', 'UMI');
  const tag26 = formatTlv('26', tag26Sub);

  let payload =
    formatTlv('00', '01') +
    formatTlv('01', isDynamic ? '12' : '11') +
    tag26 +
    formatTlv('51', formatTlv('00', 'ID.CO.QRIS.WWW') + formatTlv('02', safeNmid)) +
    formatTlv('52', '5812') + // Eating places / Merchant category
    formatTlv('53', '360') +  // IDR Currency
    (isDynamic && nominal > 0 ? formatTlv('54', String(Math.floor(nominal))) : '') +
    formatTlv('58', 'ID') +   // Indonesia
    formatTlv('59', safeName) +
    formatTlv('60', safeCity) +
    formatTlv('61', '10110') + // Postal Code
    '6304';

  const crc = calculateCrc16(payload);
  return `${payload}${crc}`;
}

// Preset Samples for Instant Testing
export const SAMPLE_QRIS_PRESETS = [
  {
    id: 'bca_merchant',
    name: 'BCA QRIS Merchant',
    merchantName: 'KONTER BERKAH CELL',
    nmid: 'ID1020039281921',
    acquirer: 'BCA',
    city: 'JAKARTA',
    samplePayload:
      '00020101021126600014ID.CO.QRIS.WWW01189360000201020304050215ID10200392819210303UMI51440014ID.CO.QRIS.WWW0215ID10200392819210303UMI5204581253033605802ID5918KONTER BERKAH CELL6007JAKARTA6105101106304B72C',
  },
  {
    id: 'dana_bisnis',
    name: 'DANA Bisnis QRIS',
    merchantName: 'TOKO MAKMUR JAYA',
    nmid: 'ID1020083921029',
    acquirer: 'DANA',
    city: 'SURABAYA',
    samplePayload:
      '00020101021126600014ID.CO.QRIS.WWW01189360000901020304050215ID10200839210290303UMI51440014ID.CO.QRIS.WWW0215ID10200839210290303UMI5204581253033605802ID5916TOKO MAKMUR JAYA6008SURABAYA6105601116304C95A',
  },
  {
    id: 'shopeepay_merchant',
    name: 'ShopeePay Merchant',
    merchantName: 'WARUNG DIGITAL SERBA ADA',
    nmid: 'ID1020094829103',
    acquirer: 'SHOPEEPAY',
    city: 'BANDUNG',
    samplePayload:
      '00020101021126600014ID.CO.QRIS.WWW01189360001401020304050215ID10200948291030303UMI51440014ID.CO.QRIS.WWW0215ID10200948291030303UMI5204581253033605802ID5924WARUNG DIGITAL SERBA ADA6007BANDUNG6105401156304A18D',
  },
  {
    id: 'mandiri_livin',
    name: 'Mandiri Livin Usaha',
    merchantName: 'PPOB LOKET DIGITAL',
    nmid: 'ID1020072910283',
    acquirer: 'MANDIRI',
    city: 'SEMARANG',
    samplePayload:
      '00020101021126600014ID.CO.QRIS.WWW01189360000801020304050215ID10200729102830303UMI51440014ID.CO.QRIS.WWW0215ID10200729102830303UMI5204581253033605802ID5918PPOB LOKET DIGITAL6008SEMARANG6105501126304D81E',
  },
];
