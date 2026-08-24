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
            points.push(Math.round(Math.min((max ?? Infinity) * roughness, Math.max((min ?? -Infinity) * roughness, Math.round((points[points.length -1] + ((Math.random() * 0.1) - 0.05) * roughness))))));
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

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function updateBallistic(target, windDirection, windStrength, gravity) {
  const dt = 1/6;
  const windRad = windDirection * Math.PI / 180;
  const windAccelX = (Math.cos(windRad) * windStrength) / target.weight;
  const windAccelY = (Math.sin(windRad) * windStrength) / target.weight;
  
  target.vx += windAccelX * dt;
  target.vy += (gravity + windAccelY) * dt;
  
  target.x += target.vx * dt;
  target.y += target.vy * dt;
  
  target.angle = Math.atan2(target.vx, -target.vy) * 180 / Math.PI;
  //target.distanceTraveled = Math.hypot(this.x - this.originalX, this.y - this.originalY); // Could be interesting to calculate bonus damage based on airtime
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}