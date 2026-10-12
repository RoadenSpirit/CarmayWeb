import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const BACKUP_DIR = path.resolve('public_backup');

console.log('=== OPTIMIZADOR AUTOMÁTICO DE IMÁGENES (SHARP) ===');
console.log(`Directorio origen: ${PUBLIC_DIR}`);
console.log(`Directorio respaldo: ${BACKUP_DIR}\n`);

const files = fs.readdirSync(PUBLIC_DIR);
const imageExtensions = ['.jpg', '.jpeg', '.png'];
const report = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!imageExtensions.includes(ext)) continue;
  if (file === 'favicon.png') continue;

  const inputPath = path.join(PUBLIC_DIR, file);
  const baseName = path.basename(file, ext);
  const webpOutputPath = path.join(PUBLIC_DIR, `${baseName}.webp`);

  const statOrig = fs.statSync(inputPath);
  const origKb = (statOrig.size / 1024).toFixed(1);

  try {
    const metadata = await sharp(inputPath).metadata();
    let pipeline = sharp(inputPath);

    // Si la imagen es un banner gigante (>1200px), redimensionar con alta fidelidad
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
    }

    await pipeline
      .webp({ quality: 80, effort: 6 })
      .toFile(webpOutputPath);

    const statWebp = fs.statSync(webpOutputPath);
    const webpKb = (statWebp.size / 1024).toFixed(1);
    const savings = (((statOrig.size - statWebp.size) / statOrig.size) * 100).toFixed(1);

    report.push({
      Archivo: file,
      Dimensiones: `${metadata.width || '?'}x${metadata.height || '?'}`,
      'Original (KB)': `${origKb} KB`,
      'WebP (KB)': `${webpKb} KB`,
      'Ahorro (%)': `${savings}%`
    });
  } catch (err) {
    console.error(`Error procesando ${file}:`, err.message);
  }
}

console.table(report);

const totalOrigBytes = report.reduce((acc, r) => acc + parseFloat(r['Original (KB)']), 0);
const totalWebpBytes = report.reduce((acc, r) => acc + parseFloat(r['WebP (KB)']), 0);
const totalSavings = (((totalOrigBytes - totalWebpBytes) / totalOrigBytes) * 100).toFixed(1);

console.log(`\nPESO TOTAL ANTES: ${totalOrigBytes.toFixed(1)} KB`);
console.log(`PESO TOTAL WEBP:  ${totalWebpBytes.toFixed(1)} KB`);
console.log(`AHORRO GLOBAL:    ${totalSavings}% (${(totalOrigBytes - totalWebpBytes).toFixed(1)} KB liberados)\n`);
