/* =========================================================================
   npm run textures
   Bakes the textures for the pile of TVs on the home page (js/pile.js) into
   assets/textures/*.webp: brushed metal, ambient occlusion, edge wear, scratches
   and dust are computed here once, so the browser only loads a few small images.
   All textures are neutral grey: js/pile.js tints them per TV (silver or gunmetal).
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'textures');
fs.mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- helpers */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const hash = (x, y, s = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const vnoise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return mix(mix(hash(xi, yi, s), hash(xi + 1, yi, s), u), mix(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), v);
};
const fbm = (x, y, s = 0, oct = 4) => {
  let v = 0, a = 0.5;
  for (let i = 0; i < oct; i += 1) { v += a * vnoise(x, y, s + i * 17); x *= 2.03; y *= 2.03; a *= 0.5; }
  return v;
};
// signed distance to a rounded rectangle (negative inside)
const sdBox = (px, py, cx, cy, hw, hh, r) => {
  const qx = Math.abs(px - cx) - hw + r, qy = Math.abs(py - cy) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};
// thin random scratches as a brightness map
function scratches(w, h, count, seed) {
  const map = new Float32Array(w * h);
  let s = seed;
  const rnd = () => hash(s++, seed, 7);
  for (let k = 0; k < count; k += 1) {
    const x = rnd() * w, y = rnd() * h;
    const ang = (rnd() - 0.5) * 1.4 + (rnd() < 0.5 ? 0.5 : -0.8);
    const len = 10 + rnd() * w * 0.18;
    const strength = 0.3 + rnd() * 0.7;
    for (let t = 0; t < len; t += 0.5) {
      const xi = Math.round(x + Math.cos(ang) * t), yi = Math.round(y + Math.sin(ang) * t);
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue;
      map[yi * w + xi] = Math.max(map[yi * w + xi], strength * Math.sin((t / len) * Math.PI));
    }
  }
  return map;
}

async function save(name, w, h, fn) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const v = fn(x + 0.5, y + 0.5, y * w + x);
      const o = (y * w + x) * 3;
      const [r, g, b] = Array.isArray(v) ? v : [v, v, v];
      buf[o] = clamp(r) * 255; buf[o + 1] = clamp(g) * 255; buf[o + 2] = clamp(b) * 255;
    }
  }
  const file = path.join(OUT, `${name}.webp`);
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 85 }).toFile(file);
  console.log(`${name}.webp  ${w}×${h}  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}

/* ------------------------------------------------------------ metal shell */
// One face of the cabinet (every face of a box maps the whole texture): brushed metal with
// horizontal streaks, darker edges and corners, worn bright edges, scratches and a few dents.
// tv-metal-rough is its roughness map: the streaks and scratches are a bit shinier.
const brushed = (x, y, s = 0) => (vnoise(x / 260, y * 0.9, s) - 0.5) * 0.09 + (hash(Math.floor(x / 37), Math.floor(y), s) - 0.5) * 0.05;
{
  const S = 512;
  const sc = scratches(S, S, 30, 3);
  const shade = (x, y, i) => {
    const u = x / S, v = y / S;
    let c = 0.62 + brushed(x, y, 1);
    c *= 0.94 + 0.08 * fbm(u * 4, v * 4, 1);           // uneven tarnish
    const edge = Math.min(u, v, 1 - u, 1 - v);
    c *= 0.7 + 0.3 * smooth(0, 0.16, edge);            // ambient occlusion into the corners
    c += 0.14 * smooth(0.012, 0, edge);                // polished, worn edge
    c += sc[i] * 0.14;
    return { c, edge };
  };
  await save('tv-metal', S, S, (x, y, i) => shade(x, y, i).c);
  await save('tv-metal-rough', S, S, (x, y, i) => {
    const { edge } = shade(x, y, i);
    return 0.55 + brushed(x, y, 2) * 1.6 - sc[i] * 0.25 - 0.15 * smooth(0.02, 0, edge);
  });
}

/* ------------------------------------------------------------- front panel */
// 1300 × 1000 (the front of every TV). Screen: x 7–78%, y 9–84% (top down), matches SCREEN in js/pile.js.
// Right: two knobs, a grille and a power light. Bottom: a badge.
{
  const W = 1300, H = 1000;
  const sx0 = W * 0.07, sx1 = W * 0.78, sy0 = H * 0.09, sy1 = H * 0.84, sr = 44;
  const sc = scratches(W, H, 50, 11);
  await save('tv-front', W, H, (x, y, i) => {
    const u = x / W, v = y / H;
    let c = 0.6 + brushed(x, y, 5);
    c *= 0.94 + 0.08 * fbm(u * 4, v * 4, 5);
    const edge = Math.min(u, v, 1 - u, 1 - v);
    c *= 0.78 + 0.22 * smooth(0, 0.08, edge);
    c += 0.12 * smooth(0.008, 0, edge);
    // the screen sits in a recess: dark lip above, a lit lip below, deep shadow around the glass
    const d = sdBox(x, y, (sx0 + sx1) / 2, (sy0 + sy1) / 2, (sx1 - sx0) / 2, (sy1 - sy0) / 2, sr);
    if (d < 0) return 0.03;
    if (d < 34) {
      const t = smooth(34, 0, d);
      c += t * (y > sy1 - sr * 0.5 ? 0.14 : y < sy0 + sr * 0.5 ? -0.12 : 0.02);
      c *= 1 - 0.75 * Math.exp(-d / 8);
    }
    // control panel on the right
    const knob = (cx, cy, r) => {
      const dd = Math.hypot(x - cx, y - cy);
      if (dd > r + 10) return null;
      if (dd > r) return c * (1 - 0.5 * smooth(r + 10, r, dd));            // contact shadow
      const lit = clamp(0.5 - ((x - cx) + (y - cy)) / (2 * r));             // lit from the top left
      const ridges = Math.cos(Math.atan2(y - cy, x - cx) * 24) * 0.04 * smooth(r * 0.6, r, dd);
      return 0.18 + lit * 0.32 + ridges + (dd < r * 0.18 ? 0.1 : 0);
    };
    const k1 = knob(W * 0.875, H * 0.24, 48), k2 = knob(W * 0.875, H * 0.43, 40);
    if (k1 !== null) return k1;
    if (k2 !== null) return k2;
    if (u > 0.825 && u < 0.925 && v > 0.56 && v < 0.82) {                   // speaker grille: horizontal slots
      const row = (y - H * 0.56) % 16;
      if (row < 7) return 0.05 + (row < 2 ? 0.06 : 0);
    }
    const led = Math.hypot(x - W * 0.875, y - H * 0.9);
    if (led < 9) return [0.75, 0.12, 0.08];                                   // power light (tinted later)
    if (u > 0.07 && u < 0.2 && v > 0.89 && v < 0.94) c += 0.08;              // little badge
    c += sc[i] * 0.08;
    return c;
  });
}

/* ------------------------------------------------------------------- floor */
// polished concrete: soft stains, fine aggregate, a few hairline cracks
{
  const S = 1024;
  const sc = scratches(S, S, 14, 31);
  await save('floor', S, S, (x, y, i) => {
    const u = x / S, v = y / S;
    let c = 0.5;
    c *= 0.8 + 0.35 * fbm(u * 3, v * 3, 7);
    c *= 0.92 + 0.1 * fbm(u * 18, v * 18, 8, 3);
    c += (hash(x, y, 2) - 0.5) * 0.06;
    c -= sc[i] * 0.12;
    return c;
  });
}

/* -------------------------------------------------------------- jewel case */
// 1136 × 1000 overlay (with transparency) that goes on top of a cover, for the archive.
// Left 0–7.5%: the hinge (dark ridged plastic). The rest: the clear lid, with a raised rim,
// a glare across it and fine scratches. The cover shows through at x 8.5–98.5%, y 1.5–98.5%.
{
  const W = 1136, H = 1000;
  const sc = scratches(W, H, 40, 23);
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x, o = i * 4;
      const u = x / W, v = y / H;
      const d = sdBox(x + 0.5, y + 0.5, W / 2, H / 2, W / 2, H / 2, 10);
      let c = 1, a = 0;
      if (d > 0) { a = 0; }
      else if (u < 0.075) {
        // hinge: ridges, a bright top edge, a dark seam towards the lid
        c = 0.1 + ((y % 9) < 3 ? 0.06 : 0) + (x < 4 ? 0.12 : 0) + (u > 0.068 ? -0.06 : 0) + (hash(x, y, 1) - 0.5) * 0.02;
        a = 1;
      } else {
        const rim = -d < 14;
        const diag = u * 0.9 + v * 0.55;
        a = 0.2 * Math.exp(-(((diag - 0.42) * 7) ** 2)) + 0.08 * Math.exp(-(((diag - 0.62) * 24) ** 2)); // glare
        a += 0.07 * smooth(0.22, 0, v);                                                                    // light along the top
        a += sc[i] * 0.2;
        if (rim) { a = Math.max(a, v < 0.5 ? 0.45 : 0.25); c = v < 0.5 ? 1 : 0.5; }
        if (u < 0.085) { c = 0.05; a = 0.85; }                                                             // shadow beside the hinge
      }
      buf[o] = buf[o + 1] = buf[o + 2] = clamp(c) * 255; buf[o + 3] = clamp(a) * 255;
    }
  }
  const file = path.join(OUT, 'jewel-case.webp');
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(file);
  console.log(`jewel-case.webp  ${W}×${H}  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
