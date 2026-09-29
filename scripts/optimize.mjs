/* =========================================================================
   npm run optimize
   1. Moves unused originals out of assets/ into _originals/ (same folder
      structure, not deployed, never deleted).
   2. Converts every JPG/PNG in assets/ to WebP (smaller, same look) and moves
      the JPG/PNG to _originals/ as a backup.
   3. Rewrites the references in the HTML, JS, CSS and Markdown files.
   Safe to run again after adding new images.
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ASSETS = path.join(ROOT, 'assets');
const BACKUP = path.join(ROOT, '_originals');
const MAX = 2400; // longest side for normal images; tall full-page screenshots keep their height

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});
const sourceFiles = () => [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, f)),
  ...walk(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')),
  ...walk(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css')),
  ...walk(path.join(ROOT, 'content')).filter((f) => f.endsWith('.md')),
  ...walk(ASSETS).filter((f) => /\/fold\/.*\.html$/.test(f)),
];
const readAll = () => sourceFiles().map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const backup = (file) => {
  const dest = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(file, dest);
};
const kb = (n) => `${Math.round(n / 1024)} KB`;

// 1. unused originals ------------------------------------------------------
let src = readAll();
// names built in code (e.g. walt${n}.jpg in the Too Wild fold) count as used
const templated = [...src.matchAll(/([\w-]+)\$\{\w+\}(\.\w+)/g)].map((m) => new RegExp(`^${m[1]}\\d+${m[2].replace('.', '\\.')}$`, 'i'));
const archive = [...src.matchAll(/file: '([^']+)'/g)].map((m) => m[1].replace(/\.\w+$/, ''));
const isUsed = (file) => {
  const name = path.basename(file);
  const stem = name.replace(/\.\w+$/, '');
  return src.includes(name) || templated.some((r) => r.test(name)) || archive.includes(stem);
};
let moved = 0;
for (const f of walk(ASSETS)) {
  if (/\.(json|otf|woff2?|svg)$/i.test(f)) continue; // fonts, lottie + svg are small and referenced indirectly
  if (!isUsed(f)) { backup(f); moved += 1; }
}
console.log(`moved ${moved} unused files to _originals/`);

// 2. convert JPG/PNG → WebP ---------------------------------------------------
let before = 0, after = 0;
const converted = new Set();
for (const f of walk(ASSETS).filter((x) => /\.(jpe?g|png)$/i.test(x))) {
  const out = f.replace(/\.(jpe?g|png)$/i, '.webp');
  const img = sharp(f);
  const { width, height } = await img.metadata();
  const tall = height > width * 2; // full-page screenshots: keep full height, limit width only
  const resize = tall ? { width: Math.min(width, 1440) } : { width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true };
  await img.resize({ ...resize, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(out);
  before += fs.statSync(f).size;
  after += fs.statSync(out).size;
  converted.add(path.basename(f));
  backup(f);
}
console.log(`converted ${converted.size} images: ${kb(before)} → ${kb(after)}`);

// 3. rewrite references ------------------------------------------------------
for (const file of sourceFiles()) {
  const text = fs.readFileSync(file, 'utf8');
  const next = text
    // plain file names
    .replace(/([\w\-. ]+)\.(jpe?g|png)\b/gi, (m, stem, ext) => (converted.has(`${stem.trim()}.${ext}`) || converted.has(`${stem.split('/').pop().trim()}.${ext}`) ? m.replace(/\.(jpe?g|png)$/i, '.webp') : m))
    // names built in code, e.g. `walt${n}.jpg`
    .replace(/(\$\{\w+\})\.(jpe?g|png)\b/gi, (m, v) => `${v}.webp`);
  if (next !== text) fs.writeFileSync(file, next);
}
console.log('references updated');
