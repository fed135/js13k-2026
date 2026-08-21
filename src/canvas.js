import config from "./config.js";
import {lerp} from "./utils.js";

export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');
const [camera, cameraCtx] = osc(config.GAME_WIDTH, config.GAME_HEIGHT);

let cameraMovement = { from: null, to: null, current: [0, 0, config.GAME_WIDTH, config.GAME_HEIGHT], ot: 0, speed: 0 };

export const a = camera;
export const c = cameraCtx;

export function cleanCanvas(cameraOnly) {
    if (!cameraOnly) {
        canvas.width = config.GAME_WIDTH;
        canvas.height = config.GAME_HEIGHT;
    }
    camera.width = window.state?.terrain?.width ?? config.GAME_WIDTH;
    camera.height = config.GAME_HEIGHT;

    ctx.imageSmoothingEnabled = false;

    cameraCtx.imageSmoothingEnabled = false;
    cameraCtx.lineCap = 'square';
}

export function osc(w, h) {
    const _a = new OffscreenCanvas(w,h);
    const _c = _a.getContext('2d');
    _c.imageSmoothingEnabled = false;

    return [_a, _c];
}

export function moveCamera(coords, speed) {
    if (!cameraMovement.to) {
      cameraMovement.from = cameraMovement.current;
      cameraMovement.to = coords;
      cameraMovement.ot = 0;
      cameraMovement.speed = speed;
    }
}

export function resetCamera(speed) {
   moveCamera([0, 0, config.GAME_WIDTH, config.GAME_HEIGHT], speed);
}

export function printFrame() {
    if (cameraMovement.to) {
        cameraMovement.current[0] = lerp(cameraMovement.from[0], cameraMovement.to[0], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[1] = lerp(cameraMovement.from[1], cameraMovement.to[1], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[2] = lerp(cameraMovement.from[2], cameraMovement.to[2], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[3] = lerp(cameraMovement.from[3], cameraMovement.to[3], cameraMovement.ot / cameraMovement.speed);

        // Bound!
        cameraMovement.current[0] = Math.min(camera.width - cameraMovement.current[2], Math.max(0, cameraMovement.current[0]));
        cameraMovement.current[1] = Math.min(camera.height, Math.max(0, cameraMovement.current[1]));

        cameraMovement.ot++;
        if (cameraMovement.ot === cameraMovement.speed) delete cameraMovement.to;
    }

    ctx.drawImage(camera, ...cameraMovement.current, 0, 0, config.GAME_WIDTH, config.GAME_HEIGHT);
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

cleanCanvas();
window.onresize = cleanCanvas;