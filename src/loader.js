import { osc } from "./canvas.js";

function _loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

export function _loadSprite(img, def) {
  const [canvas, ctx] = osc(def.w, def.h);
 
  ctx.drawImage(img, def.x, def.y, def.w, def.h, 0, 0, def.w, def.h);

  return canvas;
}

export async function loadAtlas(image, manifest) {
  const img = await _loadImage(image);
  return Object.keys(manifest).reduce((acc, curr) => {
    acc[curr] = _loadSprite(img, manifest[curr]);
    return acc;
  }, {});
}

