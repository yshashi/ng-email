#!/usr/bin/env node
// Generates the placeholder images used by blocks (assets/*.png): soft
// two-color gradients with a few translucent circles. PNG, not SVG, because
// many email clients (Gmail included) do not display SVG images.
// Deterministic: rerunning produces identical files.
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const out = join(resolve(import.meta.dirname, '..'), 'assets');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw.set([r, g, b], row + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Gradient from `from` to `to` (top-left → bottom-right) with soft white circles. */
function artwork(width, height, from, to, circles) {
  const a = hex(from);
  const b = hex(to);
  return png(width, height, (x, y) => {
    let color = mix(a, b, (x / width + y / height) / 2);
    for (const [cx, cy, r, alpha] of circles) {
      const d = Math.hypot(x - cx * width, y - cy * height);
      if (d < r * width) color = mix(color, [255, 255, 255], alpha * (1 - (d / (r * width)) ** 4));
    }
    return color;
  });
}

const images = {
  'product.png': artwork(560, 420, '#e0e7ff', '#c7d2fe', [[0.5, 0.52, 0.22, 0.85], [0.5, 0.52, 0.12, 0.6]]),
  'article.png': artwork(1104, 552, '#fde68a', '#fca5a5', [[0.28, 0.4, 0.18, 0.45], [0.72, 0.62, 0.24, 0.35]]),
  'gallery-1.png': artwork(536, 536, '#a7f3d0', '#6ee7b7', [[0.35, 0.35, 0.3, 0.4]]),
  'gallery-2.png': artwork(536, 536, '#bfdbfe', '#93c5fd', [[0.65, 0.4, 0.26, 0.45]]),
  'gallery-3.png': artwork(536, 536, '#fbcfe8', '#f9a8d4', [[0.4, 0.62, 0.28, 0.4]]),
  'gallery-4.png': artwork(536, 536, '#ddd6fe', '#c4b5fd', [[0.6, 0.6, 0.3, 0.42]]),
};

for (const [name, data] of Object.entries(images)) {
  await writeFile(join(out, name), data);
  console.log(`${name.padEnd(14)} ${(data.length / 1024).toFixed(1)} kB`);
}
