import Projectile from "./projectile.js";

export default class Grenade extends Projectile {
    static icon = '&#x1F9E8;';

    constructor(behavior) {
        super(window.assets.grenade, [0,255,0], 80, 20, 320, 600, behavior);

        this.bounce = null;
    }

    fire(x, y, angle, speed) {
        if (this.bounce === null) this.bounce = [angle * 0.9, speed * 0.5];
        super.fire(x, y, angle, speed);
    }

    detonate(offset) {
        if (this.bounce?.length) {
            this.fire(this.x, this.y, ...this.bounce);
            this.bounce = false;
            return;
        }
        super.detonate(offset);
    }
}