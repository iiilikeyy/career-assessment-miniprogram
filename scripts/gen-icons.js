/**
 * 生成小程序tabbar图标（简单纯色PNG）
 * 用法: node scripts/gen-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconDir = path.join(__dirname, '..', 'images', 'tab');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

/**
 * 生成简单的PNG图片（纯色带简单形状）
 * @param {number} size - 图片尺寸
 * @param {string} bgColor - 背景色 [r,g,b,a]
 * @param {string} shapeColor - 形状颜色 [r,g,b,a]
 * @param {string} shape - 形状: 'home' | 'user' | 'circle'
 */
function generatePng(size, bgColor, shapeColor, shape) {
  const width = size;
  const height = size;

  // 创建像素数据
  const pixels = [];
  for (let y = 0; y < height; y++) {
    pixels.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const cx = width / 2;
      const cy = height / 2;
      let inShape = false;

      if (shape === 'home') {
        // 简单房子形状
        const roofTop = height * 0.2;
        const roofBottom = height * 0.45;
        const bodyTop = height * 0.45;
        const bodyBottom = height * 0.8;
        const bodyLeft = width * 0.25;
        const bodyRight = width * 0.75;

        // 屋顶（三角形）
        if (y >= roofTop && y <= roofBottom) {
          const t = (y - roofTop) / (roofBottom - roofTop);
          const leftX = cx - (cx - width * 0.1) * t;
          const rightX = cx + (cx - width * 0.1) * t;
          if (x >= leftX && x <= rightX) inShape = true;
        }
        // 房身
        if (y >= bodyTop && y <= bodyBottom && x >= bodyLeft && x <= bodyRight) {
          inShape = true;
        }
        // 门
        const doorTop = height * 0.55;
        const doorBottom = height * 0.8;
        const doorLeft = width * 0.42;
        const doorRight = width * 0.58;
        if (y >= doorTop && y <= doorBottom && x >= doorLeft && x <= doorRight) {
          inShape = false; // 门是背景色
        }
      } else if (shape === 'user') {
        // 简单人形（圆头+身体）
        const headRadius = width * 0.18;
        const headCy = height * 0.3;
        const dx = x - cx;
        const dy = y - headCy;
        // 头
        if (dx * dx + dy * dy <= headRadius * headRadius) {
          inShape = true;
        }
        // 身体（半圆/梯形）
        const bodyTop = height * 0.5;
        const bodyBottom = height * 0.8;
        if (y >= bodyTop && y <= bodyBottom) {
          const t = (y - bodyTop) / (bodyBottom - bodyTop);
          const bodyHalfW = width * (0.15 + 0.2 * t);
          if (Math.abs(x - cx) <= bodyHalfW) {
            inShape = true;
          }
        }
      } else {
        // 圆形
        const radius = width * 0.35;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radius * radius) {
          inShape = true;
        }
      }

      const color = inShape ? shapeColor : bgColor;
      pixels.push(color[0], color[1], color[2], color[3]);
    }
  }

  // 压缩
  const rawData = Buffer.from(pixels);
  const compressed = zlib.deflateSync(rawData);

  // 构造PNG
  function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 生成4个图标
const size = 81; // 小程序tabbar推荐尺寸

// 灰色首页图标
const homeGray = generatePng(size, [255, 255, 255, 0], [153, 153, 153, 255], 'home');
fs.writeFileSync(path.join(iconDir, 'home.png'), homeGray);
console.log('home.png generated');

// 紫色首页图标（选中态）
const homePurple = generatePng(size, [255, 255, 255, 0], [102, 126, 234, 255], 'home');
fs.writeFileSync(path.join(iconDir, 'home-active.png'), homePurple);
console.log('home-active.png generated');

// 灰色我的图标
const mineGray = generatePng(size, [255, 255, 255, 0], [153, 153, 153, 255], 'user');
fs.writeFileSync(path.join(iconDir, 'mine.png'), mineGray);
console.log('mine.png generated');

// 紫色我的图标（选中态）
const minePurple = generatePng(size, [255, 255, 255, 0], [102, 126, 234, 255], 'user');
fs.writeFileSync(path.join(iconDir, 'mine-active.png'), minePurple);
console.log('mine-active.png generated');

console.log('\nAll icons generated at:', iconDir);
