import Projectile from "./projectile.js";

export default class Bullet extends Projectile {
    static icon = '&#x26A1;';

    constructor(behavior) {
        super(window.assets.bullet, [0,255,0], 100, 100, 100, 10, behavior);
    }
}
