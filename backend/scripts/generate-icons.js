/**
 * generate-icons.js — Génère les icônes PNG pour la PWA DrawRun
 * 
 * Génère icon-192x192.png et icon-512x512.png dans frontend/public/
 * en utilisant uniquement des modules Node.js natifs (pas de dépendance externe).
 * 
 * Usage: node scripts/generate-icons.js
 */

'use strict';

/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'frontend', 'public');

/**
 * Encode un entier 32 bits big-endian en 4 octets
 */
function uint32BE(n) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(n >>> 0, 0);
    return buf;
}

/**
 * Calcule le CRC32 d'un buffer (pour PNG)
 */
function crc32(buf) {
    const table = makeCRCTable();
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable = null;
function makeCRCTable() {
    if (_crcTable) return _crcTable;
    _crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        _crcTable[n] = c;
    }
    return _crcTable;
}

/**
 * Crée un chunk PNG
 */
function pngChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBytes, data]);
    const crc = crc32(crcData);
    return Buffer.concat([uint32BE(data.length), typeBytes, data, uint32BE(crc)]);
}

/**
 * Génère un PNG RGBA de taille size×size avec un fond bleu et le texte "DR"
 * Utilise uniquement zlib natif pour la compression
 */
function generateDrawRunIcon(size) {
    const width = size;
    const height = size;
    
    // Couleurs
    const BG_COLOR = { r: 59, g: 130, b: 246, a: 255 };   // #3b82f6 bleu
    const TEXT_COLOR = { r: 255, g: 255, b: 255, a: 255 }; // blanc
    const DARK_BG = { r: 29, g: 78, b: 216, a: 255 };      // #1d4ed8 bleu foncé (bord)
    
    // Créer les données de pixels RGBA
    const pixels = new Uint8Array(width * height * 4);
    
    const cx = width / 2;
    const cy = height / 2;
    const radius = width * 0.45;
    const borderRadius = width * 0.48;
    
    // Dessiner pixel par pixel
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > borderRadius) {
                // Transparent (hors du cercle)
                pixels[idx] = 0;
                pixels[idx + 1] = 0;
                pixels[idx + 2] = 0;
                pixels[idx + 3] = 0;
            } else if (dist > radius) {
                // Bord foncé
                pixels[idx] = DARK_BG.r;
                pixels[idx + 1] = DARK_BG.g;
                pixels[idx + 2] = DARK_BG.b;
                pixels[idx + 3] = DARK_BG.a;
            } else {
                // Fond bleu avec dégradé radial léger
                const gradient = 1 - (dist / radius) * 0.15;
                pixels[idx] = Math.round(BG_COLOR.r * gradient);
                pixels[idx + 1] = Math.round(BG_COLOR.g * gradient);
                pixels[idx + 2] = Math.round(BG_COLOR.b * gradient);
                pixels[idx + 3] = BG_COLOR.a;
            }
        }
    }
    
    // Dessiner "DR" en pixels blancs (police bitmap simple)
    const letterScale = size / 192;
    drawLetter(pixels, width, height, 'D', Math.round(cx - 28 * letterScale), Math.round(cy), Math.round(22 * letterScale), TEXT_COLOR);
    drawLetter(pixels, width, height, 'R', Math.round(cx + 8 * letterScale), Math.round(cy), Math.round(22 * letterScale), TEXT_COLOR);
    
    // Encoder en PNG
    return encodePNG(pixels, width, height);
}

/**
 * Dessine une lettre bitmap simple (D ou R)
 */
function drawLetter(pixels, imgWidth, imgHeight, letter, cx, cy, scale, color) {
    const patterns = {
        'D': [
            [0,0,1,1,0],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,0,1,1,0],
        ],
        'R': [
            [0,1,1,1,0],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,1,1,1,0],
            [0,1,0,1,0],
            [0,1,0,0,1],
            [0,1,0,0,1],
        ],
    };
    
    const pattern = patterns[letter];
    if (!pattern) return;
    
    const rows = pattern.length;
    const cols = pattern[0].length;
    const pixelSize = Math.max(1, Math.round(scale / cols));
    const totalW = cols * pixelSize;
    const totalH = rows * pixelSize;
    const startX = Math.round(cx - totalW / 2);
    const startY = Math.round(cy - totalH / 2);
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (pattern[row][col]) {
                for (let py = 0; py < pixelSize; py++) {
                    for (let px = 0; px < pixelSize; px++) {
                        const x = startX + col * pixelSize + px;
                        const y = startY + row * pixelSize + py;
                        if (x >= 0 && x < imgWidth && y >= 0 && y < imgHeight) {
                            const idx = (y * imgWidth + x) * 4;
                            pixels[idx] = color.r;
                            pixels[idx + 1] = color.g;
                            pixels[idx + 2] = color.b;
                            pixels[idx + 3] = color.a;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Encode des pixels RGBA en PNG valide
 */
function encodePNG(pixels, width, height) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    
    // Raw image data with filter bytes
    const rawData = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0; // filter type: None
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = y * (1 + width * 4) + 1 + x * 4;
            rawData[dstIdx] = pixels[srcIdx];
            rawData[dstIdx + 1] = pixels[srcIdx + 1];
            rawData[dstIdx + 2] = pixels[srcIdx + 2];
            rawData[dstIdx + 3] = pixels[srcIdx + 3];
        }
    }
    
    // Compress with zlib
    const compressed = zlib.deflateSync(rawData, { level: 6 });
    
    // IEND chunk
    const iend = Buffer.alloc(0);
    
    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', iend),
    ]);
}

// Générer les icônes
function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const sizes = [192, 512];
    for (const size of sizes) {
        const pngBuffer = generateDrawRunIcon(size);
        const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
        fs.writeFileSync(outputPath, pngBuffer);
        console.log(`✅ Generated ${outputPath} (${pngBuffer.length} bytes)`);
    }
    
    console.log('✅ All icons generated successfully!');
}

main();
