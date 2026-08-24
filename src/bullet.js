import config from "./config.js";
import Projectile from "./projectile.js";
import {sfx} from "./audio.js";

const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

export default class Bullet extends Projectile {
    static icon = '&#x26A1;';

    constructor(behavior) {
        super(window.assets.bullet, [0,255,0], 100, 100, 100, 10, behavior);
    }

    detonate() {
        setTimeout(() => {
            Projectile.particleSystem(this.x - 60, this.y + sc, [128,128,255], 20, 50);
            state.terrain.crater(this.x + sc - 60, this.falloff, false);
            sfx(config.S.detonation, [60,100], 2);
        }, 400);
        Projectile.particleSystem(this.x, this.y + sc, [128,128,255], 20, 50);

        setTimeout(() => {
            Projectile.particleSystem(this.x + 60, this.y + sc, [128,128,255], 20, 50);
            state.terrain.crater(this.x + sc + 60, this.falloff, false);
            sfx(config.S.detonation, [60,100], 2);
        }, 800);

        super.detonate();
    }
}
