import { osc } from "./canvas.js";
import config from "./config.js";

export function applyRecolor(imageData, from, to) {
  const data = imageData.data;
  const [fr, fg, fb] = from;
  const [tr, tg, tb] = to;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue; // skip fully transparent pixels

    if (
      Math.abs(r - fr) <= 0 &&
      Math.abs(g - fg) <= 0 &&
      Math.abs(b - fb) <= 0
    ) {
      data[i] = tr;
      data[i + 1] = tg;
      data[i + 2] = tb;
    }
  }
}

export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

let perlinCache;

export function perlin() {
  if (perlinCache) return perlinCache;
  let ctx;
  [perlinCache, ctx] = osc(128, 128);
  const I = ctx.getImageData(0, 0, 128, 128);
  const D = I.data;

  const P = new Uint8Array(256);
  for (let i = 0; i < 256; i++) P[i] = Math.random() * 256;

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const grad = (h, x, y) => (h & 3) == 0 ? x : (h & 3) == 1 ? -x : (h & 3) == 2 ? y : -y;

  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = P[P[X] + Y], ab = P[P[X] + Y + 1];
    const ba = P[P[X + 1] + Y], bb = P[P[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
      lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
      v
    );
  };

  const CELL = 4;
  const LEVELS = 4;
  const SCALE = 8;

  const BAYER = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
  ].map(v => (v + 0.5) / 16);

  let p = 0;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const cx = Math.floor(x / CELL) * CELL;
      const cy = Math.floor(y / CELL) * CELL;
      const n = (noise(cx / SCALE, cy / SCALE) + 1) / 2;

      const threshold = BAYER[(y % 4) * 4 + (x % 4)];
      const banded = Math.floor((n * (LEVELS - 1) + threshold)) / (LEVELS - 1);
      const val = Math.max(0, Math.min(255, Math.round(banded * 255)));

      D[p++] = val; D[p++] = val; D[p++] = val; D[p++] = 255;
    }
  }

  ctx.putImageData(I, 0, 0);
  return perlinCache;
}

export function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

export function randColor() {
  return [rand(0,255), rand(0,255), rand(0,255)];
}

export const accelerationCurve = t => t * t * (3 - 2 * t);

export function randomBase() {
  return [rand(config.BASE_COLORS_MIN, config.BASE_COLOR_MAX), rand(0,config.BASE_COLORS_MIN), rand(config.BASE_COLORS_MIN, config.BASE_COLOR_MAX)];
}

export function randomPoints(amount, startingValue, variation, roughness, min, max) {
    const points = [startingValue];
    for(let i = 0; i < amount; i++ ) {
        if (Math.random() < variation) {
            points.push(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Math.round((points[points.length -1] + ((Math.random() * 0.1) - 0.05) * roughness)))));
        }
        else points.push(points[points.length -1]);
    }
    return points;
}

export function $(id) {
  return document.getElementById(id);
}

export function hide(element) {
  element.style.display = 'none';
}

export function show(element) {
  element.style.display = 'block';
}