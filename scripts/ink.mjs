/* =========================================================================
   npm run ink
   Makes the ink details for the site in assets/ink/:
   - speckle.webp: a tile of tiny ink specks and dust, laid over the light boards
   - splash-1..3.webp: small ink splashes (a blot with droplets around it)
   - bubbles.webp: the ink drawing (assets/ink/source/bubbles.png) with a transparent background
   All are black ink on transparent, so they work on any background.
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'ink');
fs.mkdirSync(OUT, { recursive: true });

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const hash = (x, y, s = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const vnoise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// draws ink (alpha only) into a W×H buffer
function canvas(W, H) {
  const a = new Float32Array(W * H);
  // an irregular blot: a circle with a noisy edge
  const blot = (cx, cy, r, rough = 0.35, s = 1) => {
    const R = Math.ceil(r * (1 + rough) + 2);
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(H, cy + R); y += 1) {
      for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, cx + R); x += 1) {
        const dx = x - cx, dy = y - cy;
        const ang = Math.atan2(dy, dx);
        const edge = r * (1 + rough * (vnoise(Math.cos(ang) * 2 + 9, Math.sin(ang) * 2 + 9, s) - 0.5) * 2);
        const k = clamp(edge - Math.hypot(dx, dy) + 0.5);
        a[y * W + x] = Math.max(a[y * W + x], k);
      }
    }
  };
  return { a, blot };
}

async function save(name, W, H, a) {
  const buf = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i += 1) { buf[i * 4] = buf[i * 4 + 1] = buf[i * 4 + 2] = 14; buf[i * 4 + 3] = clamp(a[i]) * 255; }
  const file = path.join(OUT, `${name}.webp`);
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 90 }).toFile(file);
  console.log(`${name}.webp  ${W}×${H}  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}

/* speckle: sparse specks, a few hairs and dust, tileable (everything wraps) */
{
  const S = 900;
  const { a, blot } = canvas(S, S);
  for (let k = 0; k < 150; k += 1) {
    const x = rnd() * S, y = rnd() * S;
    const r = rnd() < 0.94 ? 0.35 + rnd() * 0.6 : 0.9 + rnd() * 1.6;
    for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) blot(x + ox, y + oy, r, 0.5, k);
  }
  // a few short hairs
  for (let k = 0; k < 2; k += 1) {
    let x = rnd() * S, y = rnd() * S, ang = rnd() * Math.PI * 2;
    for (let t = 0; t < 40 + rnd() * 50; t += 0.5) {
      ang += (rnd() - 0.5) * 0.15; x += Math.cos(ang) * 0.5; y += Math.sin(ang) * 0.5;
      const xi = ((Math.round(x) % S) + S) % S, yi = ((Math.round(y) % S) + S) % S;
      a[yi * S + xi] = Math.max(a[yi * S + xi], 0.55);
    }
  }
  await save('speckle', S, S, a.map((v) => v * 0.5)); // a little lighter than the splashes
}

/* splashes: a main blot, a ring of droplets flung out, a couple of streaks */
for (let n = 1; n <= 3; n += 1) {
  const S = 360;
  const { a, blot } = canvas(S, S);
  const c = S / 2;
  blot(c, c, 26 + n * 6, 0.45, n * 11);
  const drops = 18 + n * 6;
  for (let k = 0; k < drops; k += 1) {
    const ang = rnd() * Math.PI * 2;
    const dist = 40 + rnd() * rnd() * 120;
    const r = Math.max(0.8, (1 - dist / 170) * (2 + rnd() * 6));
    blot(c + Math.cos(ang) * dist, c + Math.sin(ang) * dist, r, 0.4, k + n * 50);
    // a streak from the blot towards some of the drops
    if (rnd() < 0.25) for (let t = 30; t < dist - r; t += 1) blot(c + Math.cos(ang) * t, c + Math.sin(ang) * t, Math.max(0.6, 3.2 * (1 - t / dist)), 0.2, k);
  }
  await save(`splash-${n}`, S, S, a);
}

/* the ink drawing: white paper becomes transparent, the ink stays */
{
  const src = path.join(OUT, 'source', 'bubbles.png');
  if (fs.existsSync(src)) {
    const { data, info } = await sharp(src).resize({ width: 1000 }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const a = new Float32Array(info.width * info.height);
    for (let i = 0; i < a.length; i += 1) a[i] = clamp((0.75 - data[i] / 255) / 0.5);
    await save('bubbles', info.width, info.height, a);
  }
}
