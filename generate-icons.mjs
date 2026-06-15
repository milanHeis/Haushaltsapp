// Generates PWA icon PNGs using only Node.js built-ins (no external packages)
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([name, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, name, data, crc])
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // Raw image data: each row starts with filter byte 0, then RGB pixels
  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0 // filter none
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[1 + x * 3 + 1] = g
    row[1 + x * 3 + 2] = b
  }
  const raw = Buffer.concat(Array(size).fill(row))
  const compressed = deflateSync(raw)

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Indigo color matching app theme
writeFileSync('public/pwa-192x192.png', makePNG(192, 99, 102, 241))
writeFileSync('public/pwa-512x512.png', makePNG(512, 99, 102, 241))
writeFileSync('public/apple-touch-icon.png', makePNG(180, 99, 102, 241))
console.log('PWA icons generated.')
