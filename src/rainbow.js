import Projectile from "./projectile.js";

export default class Rainbow extends Projectile {
    constructor(behavior) {
        super(window.assets.star, [0,255,0], 100, 400, 100, 40, behavior);
    }
}
