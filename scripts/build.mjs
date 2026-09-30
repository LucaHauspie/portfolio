/* =========================================================================
   npm run build
   Copies only what the live site needs into dist/ and minifies the CSS + JS.
   The source files stay untouched. `npm run deploy` publishes dist/.
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');

// what the site needs: pages, styles, scripts, texts, assets and the favicon
const INCLUDE = [
  'index.html', 'about.html', 'archive.html', 'contact.html', 'project.html',
  'favicon.svg', '.nojekyll',
  'css', 'js', 'content', 'assets',
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});

fs.rmSync(DIST, { recursive: true, force: true });

let files = 0, before = 0, after = 0;
for (const entry of INCLUDE) {
  const src = path.join(ROOT, entry);
  if (!fs.existsSync(src)) continue;
  const list = fs.statSync(src).isDirectory() ? walk(src) : [src];
  for (const file of list) {
    if (path.basename(file) === '.DS_Store') continue;
    const out = path.join(DIST, path.relative(ROOT, file));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ext = path.extname(file);
    // minify the site's own CSS and JS (not the hero folds: they're small and self-contained)
    if ((ext === '.js' || ext === '.css') && !file.includes(`${path.sep}fold${path.sep}`)) {
      const code = fs.readFileSync(file, 'utf8');
      const { code: min } = await transform(code, { loader: ext.slice(1), minify: true, target: 'es2020' });
      fs.writeFileSync(out, min);
      before += code.length;
      after += min.length;
    } else {
      fs.copyFileSync(file, out);
    }
    files += 1;
  }
}

const size = walk(DIST).reduce((n, f) => n + fs.statSync(f).size, 0);
console.log(`dist/ ready: ${files} files, ${(size / 1024 / 1024).toFixed(1)} MB`);
console.log(`css + js minified: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`);
