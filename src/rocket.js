import Projectile from "./projectile.js";
import config from './config.js';

export default class Rocket extends Projectile {
    constructor(behavior) {
        super(window.assets.rocket, [255,0,0], 100, 20, 200, 20, behavior);
    }
}