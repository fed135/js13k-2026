import Projectile from "./projectile.js";

export default class Grenade extends Projectile {
    constructor(behavior) {
        super(window.assets.grenade, [0,255,0], 100, 250, 400, 40, behavior);
    }
}