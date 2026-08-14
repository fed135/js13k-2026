import Projectile from "./projectile.js";

export default class Bullet extends Projectile {
    constructor(behavior) {
        super(window.assets.star, [0,255,0], 100, 100, 20, 10, behavior);
    }
}
