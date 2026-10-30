import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data: height rows, each with 1 filter byte + width * 4 bytes
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLen);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;
  const safeMargin = isMaskable ? 0.8 : 0.95;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Background
      let r = 79, g = 70, b = 229, a = 255; // #4f46e5 (Indigo 600)

      // Slight radial gradient on background
      const distFromCenter = Math.hypot(x - cx, y - cy) / (width * 0.7);
      if (distFromCenter < 1) {
        r = Math.min(255, Math.floor(67 + 30 * (1 - distFromCenter)));
        g = Math.min(255, Math.floor(56 + 30 * (1 - distFromCenter)));
        b = Math.min(255, Math.floor(202 + 40 * (1 - distFromCenter)));
      }

      // Receipt card area
      // Centered white card with rounded top and zigzag bottom
      const cardW = 280 * scale * safeMargin;
      const cardH = 340 * scale * safeMargin;
      const cardX1 = cx - cardW / 2;
      const cardX2 = cx + cardW / 2;
      const cardY1 = cy - cardH / 2;
      const cardY2 = cy + cardH / 2;

      if (x >= cardX1 && x <= cardX2 && y >= cardY1 && y <= cardY2) {
        // Check top corner rounding
        const cornerR = 24 * scale;
        let insideCard = true;
        if (x < cardX1 + cornerR && y < cardY1 + cornerR) {
          if (Math.hypot(x - (cardX1 + cornerR), y - (cardY1 + cornerR)) > cornerR) insideCard = false;
        } else if (x > cardX2 - cornerR && y < cardY1 + cornerR) {
          if (Math.hypot(x - (cardX2 - cornerR), y - (cardY1 + cornerR)) > cornerR) insideCard = false;
        }

        // Zigzag bottom
        if (y > cardY2 - 16 * scale) {
          const toothW = 20 * scale;
          const toothH = 14 * scale;
          const modX = (x - cardX1) % toothW;
          const toothY = cardY2 - toothH + Math.abs(modX - toothW / 2) * (toothH / (toothW / 2));
          if (y > toothY) insideCard = false;
        }

        if (insideCard) {
          // White paper
          r = 255; g = 255; b = 255;

          // Header strip on receipt: Emerald / Cyan badge
          const badgeY1 = cardY1 + 36 * scale * safeMargin;
          const badgeY2 = badgeY1 + 32 * scale * safeMargin;
          if (y >= badgeY1 && y <= badgeY2 && x >= cardX1 + 30 * scale && x <= cardX2 - 30 * scale) {
            r = 16; g = 185; b = 129; // Emerald #10b981
          }

          // Lightning bolt symbol in center of receipt
          // Triangle 1: (cx + 10, cy - 60) -> (cx - 40, cy + 10) -> (cx + 5, cy + 10)
          // Triangle 2: (cx - 5, cy) -> (cx + 40, cy - 10) -> (cx - 10, cy + 70)
          const normX = (x - cx) / scale;
          const normY = (y - cy) / scale;

          // Lightning bolt polygon approximation
          // Check if inside upper or lower bolt
          const inBolt1 = (normY >= -50 && normY <= 15 && normX >= -35 && normX <= 25 && (normY - -50) * 1.5 > (normX - -10));
          const inBolt2 = (normY >= 5 && normY <= 65 && normX >= -20 && normX <= 35 && (normY - 5) * 1.5 < (normX - -5) + 60);

          if ((inBolt1 || inBolt2) && normX > -30 && normX < 30 && normY > -55 && normY < 65) {
            r = 245; g = 158; b = 11; // Amber #f59e0b
          }

          // Printed dashed lines below bolt
          const line1Y = cardY2 - 80 * scale * safeMargin;
          const line2Y = cardY2 - 50 * scale * safeMargin;
          if (Math.abs(y - line1Y) < 3 * scale && x >= cardX1 + 25 * scale && x <= cardX2 - 25 * scale) {
            if (Math.floor(x / (10 * scale)) % 2 === 0) {
              r = 148; g = 163; b = 184;
            }
          }
          if (Math.abs(y - line2Y) < 3 * scale && x >= cardX1 + 40 * scale && x <= cardX2 - 40 * scale) {
            if (Math.floor(x / (10 * scale)) % 2 === 0) {
              r = 148; g = 163; b = 184;
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPng(64, 64, false));

// Generate SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    <path d="M140 100 C140 84 154 70 170 70 L342 70 C358 70 372 84 372 100 L372 410 L352 396 L332 410 L312 396 L292 410 L272 396 L252 410 L232 396 L212 410 L192 396 L172 410 L152 396 L140 405 Z" fill="#ffffff"/>
    <rect x="175" y="110" width="162" height="32" rx="8" fill="#10b981"/>
    <text x="256" y="132" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="16" text-anchor="middle">STRUK KASIR</text>
    <path d="M268 175 L220 260 L260 260 L244 335 L292 245 L252 245 Z" fill="#f59e0b" stroke="#d97706" stroke-width="4" stroke-linejoin="round"/>
    <line x1="175" y1="355" x2="337" y2="355" stroke="#94a3b8" stroke-width="5" stroke-dasharray="10 6"/>
    <line x1="195" y1="375" x2="317" y2="375" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="8 6"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf8');

console.log('PWA icons created successfully in /public');
