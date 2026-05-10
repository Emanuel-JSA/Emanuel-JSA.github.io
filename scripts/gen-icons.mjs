#!/usr/bin/env node
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c;
    }
    return t;
})();

function crc32(buf) {
    let crc = 0xffffffff;
    for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body));
    return Buffer.concat([lenBuf, body, crcBuf]);
}

function solidPNG(w, h, r, g, b) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type: RGB
    // bytes 10-12: compression=0, filter=0, interlace=0

    const rowSize = 1 + w * 3;
    const raw = Buffer.alloc(h * rowSize);
    for (let y = 0; y < h; y++) {
        const base = y * rowSize;
        // filter byte 0 (None) já está zero por padrão
        for (let x = 0; x < w; x++) {
            raw[base + 1 + x * 3] = r;
            raw[base + 1 + x * 3 + 1] = g;
            raw[base + 1 + x * 3 + 2] = b;
        }
    }

    return Buffer.concat([
        sig,
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

mkdirSync("icons", { recursive: true });

const [r, g, b] = [0x1a, 0x1a, 0x1a]; 

writeFileSync("icons/icon-192.png", solidPNG(192, 192, r, g, b));
writeFileSync("icons/icon-512.png", solidPNG(512, 512, r, g, b));
writeFileSync("icons/icon-maskable-192.png", solidPNG(192, 192, r, g, b));
writeFileSync("icons/icon-maskable-512.png", solidPNG(512, 512, r, g, b));

console.log("Ícones gerados em icons/");
