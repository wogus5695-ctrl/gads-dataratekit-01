import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawWithFilter = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawWithFilter[y * (stride + 1)] = 0;
    rgbaBuffer.copy(rawWithFilter, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawWithFilter, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  let width, height;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idats));
  const stride = width * 4;
  const raw = Buffer.alloc(width * height * 4);

  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    const rowStart = y * stride;
    for (let x = 0; x < width; x++) {
      const pxStart = rowStart + x * 4;
      for (let c = 0; c < 4; c++) {
        const rawByte = decompressed[srcPos++];
        let left = x > 0 ? raw[pxStart - 4 + c] : 0;
        let up = y > 0 ? raw[pxStart - stride + c] : 0;
        let upleft = x > 0 && y > 0 ? raw[pxStart - stride - 4 + c] : 0;
        let val = 0;
        if (filter === 0) val = rawByte;
        else if (filter === 1) val = (rawByte + left) & 0xff;
        else if (filter === 2) val = (rawByte + up) & 0xff;
        else if (filter === 3) val = (rawByte + Math.floor((left + up) / 2)) & 0xff;
        else if (filter === 4) {
          const p = left + up - upleft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upleft);
          let pr = left;
          if (pb < pa) pr = up;
          if (pc < Math.min(pa, pb)) pr = upleft;
          val = (rawByte + pr) & 0xff;
        }
        raw[pxStart + c] = val;
      }
    }
  }
  return { width, height, data: raw };
}

function resizeBilinear(srcWidth, srcHeight, srcData, srcCrop, dstSize) {
  const dstData = Buffer.alloc(dstSize * dstSize * 4);
  const { x0, y0, w: cropW, h: cropH } = srcCrop;

  for (let dstY = 0; dstY < dstSize; dstY++) {
    const srcY = y0 + ((dstY + 0.5) / dstSize) * cropH - 0.5;
    const yFloor = Math.max(0, Math.min(srcHeight - 1, Math.floor(srcY)));
    const yCeil = Math.max(0, Math.min(srcHeight - 1, yFloor + 1));
    const yWeight = Math.max(0, Math.min(1, srcY - yFloor));

    for (let dstX = 0; dstX < dstSize; dstX++) {
      const srcX = x0 + ((dstX + 0.5) / dstSize) * cropW - 0.5;
      const xFloor = Math.max(0, Math.min(srcWidth - 1, Math.floor(srcX)));
      const xCeil = Math.max(0, Math.min(srcWidth - 1, xFloor + 1));
      const xWeight = Math.max(0, Math.min(1, srcX - xFloor));

      const idx00 = (yFloor * srcWidth + xFloor) * 4;
      const idx10 = (yFloor * srcWidth + xCeil) * 4;
      const idx01 = (yCeil * srcWidth + xFloor) * 4;
      const idx11 = (yCeil * srcWidth + xCeil) * 4;

      const dstIdx = (dstY * dstSize + dstX) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcData[idx00 + c] * (1 - xWeight) + srcData[idx10 + c] * xWeight;
        const bottom = srcData[idx01 + c] * (1 - xWeight) + srcData[idx11 + c] * xWeight;
        dstData[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
      }
    }
  }
  return dstData;
}

function buildIco(pngBuffers) {
  // ICO header: 6 bytes
  // ICONDIRENTRY: 16 bytes each
  // Then concatenated PNG data
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // color palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

function main() {
  const sourcePath =
    'C:/Users/wogus/.gemini/antigravity/brain/b1375096-532a-4c80-b76c-59667190a05a/.user_uploaded/media_1791941079827_a302815d.png';
  const decoded = decodePng(sourcePath);
  console.log(`Source decoded: ${decoded.width}x${decoded.height}`);

  // Black pixel bbox: minX: 216, maxX: 800, minY: 281, maxY: 773 (w: 585, h: 493)
  // Center of DR: cx = 508, cy = 527
  // We want the monogram to occupy ~78-80% of the square canvas.
  // 585 / 0.80 = ~731. Let's use cropSize = 730
  const cropSize = 730;
  const cx = 508;
  const cy = 527;
  const x0 = Math.max(0, Math.min(decoded.width - cropSize, Math.round(cx - cropSize / 2)));
  const y0 = Math.max(0, Math.min(decoded.height - cropSize, Math.round(cy - cropSize / 2)));

  const crop = { x0, y0, w: cropSize, h: cropSize };
  console.log('Crop window:', crop);
  console.log(`Monogram width occupancy: ${(585 / cropSize * 100).toFixed(1)}%`);
  console.log(`Monogram height occupancy: ${(493 / cropSize * 100).toFixed(1)}%`);

  // Target sizes: 16, 32, 48, 64, 180
  const sizes = [16, 32, 48, 64, 180];
  const pngs = {};

  for (const s of sizes) {
    const resizedRgba = resizeBilinear(decoded.width, decoded.height, decoded.data, crop, s);
    pngs[s] = encodePng(s, s, resizedRgba);
    console.log(`Generated PNG ${s}x${s} (${pngs[s].length} bytes)`);
  }

  // Generate multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  const icoBuffer = buildIco([
    { size: 16, buffer: pngs[16] },
    { size: 32, buffer: pngs[32] },
    { size: 48, buffer: pngs[48] },
  ]);

  const appDir = path.resolve(__dirname, '..', 'src', 'app');
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log(`Wrote src/app/favicon.ico (${icoBuffer.length} bytes)`);

  fs.writeFileSync(path.join(appDir, 'icon.png'), pngs[32]);
  console.log(`Wrote src/app/icon.png 32x32 (${pngs[32].length} bytes)`);

  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngs[180]);
  console.log(`Wrote src/app/apple-icon.png 180x180 (${pngs[180].length} bytes)`);
}

main();
