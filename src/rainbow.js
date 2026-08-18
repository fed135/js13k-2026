import Projectile from "./projectile.js";
import { lerp } from "./utils.js";
import {c} from './canvas.js';

const rainbowColors = [[255,255,85], [85,255,255], [255,85,255]];

function rainbowLerp(t, direction) {
    let r, g, b;
    if (t < 0.5) {
    // Phase 1: Scale progress from [0, 0.5] to [0, 1]
    const localT = t * 2;
    r = lerp(rainbowColors[0][0], rainbowColors[1][0], localT);
    g = lerp(rainbowColors[0][1], rainbowColors[1][1], localT);
    b = lerp(rainbowColors[0][2], rainbowColors[1][2], localT);
  } else {
    // Phase 2: Scale progress from [0.5, 1] to [0, 1]
    const localT = (t - 0.5) * 2;
    r = lerp(rainbowColors[1][0], rainbowColors[2][0], localT);
    g = lerp(rainbowColors[1][1], rainbowColors[2][1], localT);
    b = lerp(rainbowColors[1][2], rainbowColors[2][2], localT);
  }

  return [r,g,b];
}

export default class Rainbow extends Projectile {
    constructor(behavior) {
        super(window.assets.star, [255,255,255], 100, 80, 100, 40, behavior);

        this.tOffset = Math.random();
        this.direction = 1;
    }

    tick() {
        this.tOffset += 0.005 * this.direction;
        if (this.tOffset >= 1 || this.tOffset <= 0) {
            this.direction *= -1;
        }
        this.tailColor = rainbowLerp(this.tOffset, this.direction);

        super.tick();
    }

    render() {
        c.lineWidth = 32;
        super.render();
    }
}
