import config from "./config.js";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

export const a = canvas;
export const c = ctx;


export function cleanCanvas() {
    a.width = config.GAME_WIDTH;
    a.height = config.GAME_HEIGHT;
    ctx.imageSmoothingEnabled = false;
}

export function osc(w, h) {
    const _a = new OffscreenCanvas(w,h);
    const _c = _a.getContext('2d');
    _c.imageSmoothingEnabled = false;

    return [_a, _c];
}

cleanCanvas();
window.onresize = cleanCanvas;