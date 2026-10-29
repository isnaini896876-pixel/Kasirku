export function formatRupiah(val: number | string | undefined | null): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) || 0 : Number(val) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatNumberOnly(val: number | string | undefined | null): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) || 0 : Number(val) || 0;
  return num.toLocaleString('id-ID');
}

export function getCurrentIndonesianDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = pad(now.getDate());
  const m = pad(now.getMonth() + 1);
  const y = now.getFullYear();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

export function formatToken20(input: string): string {
  // Strip non-digits
  const clean = input.replace(/\D/g, '').slice(0, 20);
  // Chunk into 4s
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? chunks.join('-') : clean;
}

export function maskAccount(account: string): string {
  const clean = account.trim();
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) {
    return clean.slice(0, 2) + '****' + clean.slice(-2);
  }
  return clean.slice(0, 3) + '*****' + clean.slice(-3);
}

// Indonesian Terbilang (Number to Words)
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

export function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'nol';
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh ' + (n % 10 !== 0 ? terbilang(n % 10) : '');
  if (n < 200) return 'seratus ' + (n % 100 !== 0 ? terbilang(n % 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus ' + (n % 100 !== 0 ? terbilang(n % 100) : '');
  if (n < 2000) return 'seribu ' + (n % 1000 !== 0 ? terbilang(n % 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu ' + (n % 1000 !== 0 ? terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta ' + (n % 1000000 !== 0 ? terbilang(n % 1000000) : '');
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' milyar ' + (n % 1000000000 !== 0 ? terbilang(n % 1000000000) : '');
  return terbilang(Math.floor(n / 1000000000000)) + ' triliun ' + (n % 1000000000000 !== 0 ? terbilang(n % 1000000000000) : '');
}

export function terbilangRupiah(num: number): string {
  const kata = terbilang(num).trim().replace(/\s+/g, ' ');
  return `${kata} rupiah`;
}
