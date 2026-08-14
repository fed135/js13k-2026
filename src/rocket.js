import Projectile from "./projectile.js";
import config from './config.js';

export default class Rocket extends Projectile {
    constructor(behavior) {
        super(window.assets.rocket, [255,0,0], 100, 200, 200, 20, behavior);
    }

    shot() {
        sfx(config.S.shot, [1200, 1250], 0.1);
    }
}