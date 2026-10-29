import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    serverTime: new Date().toISOString(),
  });
});

// API OCR and Intelligent Receipt Parsing
app.post('/api/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', text } = req.body;

    if (!imageBase64 && !text) {
      res.status(400).json({ error: 'Data gambar atau teks harus disertakan.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi. Menggunakan parser cerdas lokal.',
        useFallback: true,
      });
      return;
    }

    const systemPrompt = `Anda adalah asisten AI kasir dan pencatat struk transaksi keuangan Indonesia (PLN Prabayar, Transfer Bank, E-Wallet, QRIS, dan Struk Toko).
Tugas Anda adalah membaca gambar bukti transaksi/screenshot transfer/struk atau teks yang diberikan, dan mengekstrak informasi menjadi format JSON terstruktur yang akurat.

Kategori yang didukung:
1. "token" : Pembelian Token Listrik PLN Prabayar
2. "transfer" : Transfer Bank (BCA, BRI, Mandiri, BNI, BSI, CIMB, Jago, SeaBank, dll) atau E-Wallet (DANA, OVO, GoPay, ShopeePay, LinkAja)
3. "qris" : Pembayaran QRIS / Merchant Settlement
4. "toko" : Pembelian barang/retail kasir

Panduan khusus Token PLN:
- Ekstrak 20 digit kode stroom / token jika ada, pisahkan dengan strip per 4 digit: XXXX-XXXX-XXXX-XXXX-XXXX
- IDPEL / No Meter: 11-12 digit
- Nama pelanggan, Tarif/Daya (contoh R1M/900VA atau R1/1300VA), Jumlah kWh
- Nominal pembelian, admin PLN, jasa konter/admin toko, dan total bayar

Panduan khusus Transfer:
- Nama bank asal & bank/e-wallet tujuan
- Nomor rekening/HP tujuan dan nama penerima
- No referensi / SN
- Nominal transfer, biaya transfer/admin bank, total

Panduan angka & nominal:
- Semua nominal uang harus berupa integer murni tanpa titik/koma (contoh 50000).`;

    const promptText = `Analisis dan ekstrak data dari bukti transaksi berikut menjadi data JSON terstruktur untuk kasir:
${text ? `Teks transaksi: "${text}"` : 'Tolong baca informasi dari gambar screenshot struk transaksi terlampir.'}`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Kategori transaksi: "token", "transfer", "qris", atau "toko"',
            },
            waktu: { type: Type.STRING, description: 'Tanggal dan waktu transaksi' },
            refNo: { type: Type.STRING, description: 'Nomor referensi atau serial number (SN)' },
            // Token PLN
            idpel: { type: Type.STRING, description: 'Nomor IDPEL atau No Meter PLN' },
            namaPelanggan: { type: Type.STRING, description: 'Nama pelanggan' },
            tarifDaya: { type: Type.STRING, description: 'Tarif dan Daya (misal R1M/900 VA)' },
            kwh: { type: Type.STRING, description: 'Jumlah kWh listrik (misal 33.1 kWh)' },
            tokenNumber: { type: Type.STRING, description: 'Kode 20 digit token PLN dipisah tanda hubung 4-4-4-4-4' },
            // Transfer
            bankPengirim: { type: Type.STRING, description: 'Bank atau E-Wallet asal pengirim' },
            bankTujuan: { type: Type.STRING, description: 'Bank atau E-Wallet penerima' },
            rekeningTujuan: { type: Type.STRING, description: 'Nomor rekening atau nomor HP tujuan' },
            namaPenerima: { type: Type.STRING, description: 'Nama pemilik rekening penerima' },
            catatan: { type: Type.STRING, description: 'Berita atau catatan transfer' },
            status: { type: Type.STRING, description: 'Status transaksi (BERHASIL, LUNAS, SUKSES)' },
            // QRIS
            merchantName: { type: Type.STRING, description: 'Nama Merchant QRIS' },
            nmid: { type: Type.STRING, description: 'NMID QRIS jika ada' },
            acquirer: { type: Type.STRING, description: 'Acquirer QRIS' },
            // Toko / Items
            items: {
              type: Type.ARRAY,
              description: 'Daftar item belanja untuk kategori toko',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  qty: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                },
                required: ['name', 'qty', 'price'],
              },
            },
            // Finansial
            nominal: { type: Type.NUMBER, description: 'Nominal pokok transaksi (rupiah murni)' },
            adminBank: { type: Type.NUMBER, description: 'Biaya admin bank atau admin PLN' },
            adminKonter: { type: Type.NUMBER, description: 'Biaya jasa konter atau toko' },
            total: { type: Type.NUMBER, description: 'Total bayar keseluruhan' },
          },
          required: ['category', 'nominal', 'total'],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Tidak ada respon teks dari model.');
    }

    const parsedData = JSON.parse(outputText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning receipt with Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Gagal memproses gambar struk dengan AI.',
      fallbackAvailable: true,
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Kasir Cetak Struk running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
