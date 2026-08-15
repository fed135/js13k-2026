import Projectile from "./projectile.js";
import config from './config.js';
import { sfx, setVolume } from "./audio.js";

export default class Rocket extends Projectile {
    constructor(behavior) {
        super(window.assets.rocket, [255,0,0], 100, 200, 200, 20, behavior);
    }

    fire(x, y, angle, speed) {
        if (this.behavior !== Projectile.BEHAVIORS.DEMO) {
            setVolume(0.1);
            sfx(config.S.shot, [1200, 1250], 0.1);

            this.x = x;
            this.y = y;
            const airtime = this._flightTime(angle, speed);
            sfx(config.S.airtime, [1200, 1250], airtime/100);
        }
        super.fire(x, y, angle, speed);
    }

    detonate() {
        if (this.behavior !== Projectile.BEHAVIORS.DEMO) {
            sfx(config.S.detonation, [60,100], 2);
            setTimeout(() => setVolume(1), 4);
        }

        super.detonate();
    }
}