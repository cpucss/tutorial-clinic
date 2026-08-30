import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('c:/Users/ac627/OneDrive/Desktop/PROJECTS/CCS Tutorial Clinic/tutorial-clinic/public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#12372a" />
  <circle cx="50" cy="50" r="32" fill="#FAF8F2" opacity="0.15" />
  <text x="50" y="62" font-size="36" font-weight="bold" fill="#FAF8F2" text-anchor="middle" font-family="sans-serif">TC</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

import zlib from 'zlib';

function createPngBuffer(width, height) {
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw bitmap data: each row starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Brand color #12372a (18, 55, 42)
      rawData[pxOffset] = 18;     // R
      rawData[pxOffset + 1] = 55; // G
      rawData[pxOffset + 2] = 42; // B
      rawData[pxOffset + 3] = 255;// A
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

async function run() {
  const p192 = await createPngBuffer(192, 192);
  fs.writeFileSync(path.join(iconsDir, 'pwa-192.png'), p192);

  const p512 = await createPngBuffer(512, 512);
  fs.writeFileSync(path.join(iconsDir, 'pwa-512.png'), p512);
  fs.writeFileSync(path.join(iconsDir, 'pwa-512-maskable.png'), p512);

  console.log('PWA icons created successfully in public/icons/');
}

run().catch(console.error);
