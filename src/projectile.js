import { osc,a,c } from "./canvas.js";
import config from "./config.js";
import { rand, updateBallistic } from "./utils.js";

const dt = 1/6;
const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

export default class Projectile {
    static STATES= {
        ready: 0,
        airtime: 1,
        detonation: 2,
        stop: 3,
        aim: 4,
    }

    static BEHAVIORS = {
        DEMO: 0,
        PLAYER: 1,
    }

    constructor(head, tailColor, tailLength, damage, falloff, weight, behavior) {
        this.sprite = osc(config.SPRITE_SIZE, config.SPRITE_SIZE);
        this.sprite[1].drawImage(head, 0, 0);

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.speed = 0;
        //this.momentum = 0;
        this.tail = [];
        this.tailColor = tailColor;
        this.tailLength = tailLength;
        this.damage = damage;
        this.falloff = falloff;
        this.weight = weight;
        this.vx = 0;
        this.vy = 0;

        this.behavior = behavior;
        this.state = Projectile.STATES.ready;
    }

    aim(angle, speed) {
        // Print dotted trajectory
    }

    fire(x, y, angle, speed) {
        console.log('FIRE!', x, y, angle, speed)
        this.x = x;
        this.y = y;
        this.state = Projectile.STATES.airtime;
        //this.momentum = this.weight * speed;
        this.angle = angle * Math.PI / 180;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = -Math.sin(this.angle) * speed;
    }

    detonate() {
        this.state = Projectile.STATES.detonation;
    }

    tick(state) {
        if (this.behavior === Projectile.BEHAVIORS.DEMO && this.state === Projectile.STATES.ready) {
            this.fire(0, 400, rand(10, 50), rand(20, 40));
        }


        if (this.state === Projectile.STATES.airtime) {

            updateBallistic(this, state.windDirection, state.windStrength, state.gravity);

            if (this.behavior === Projectile.BEHAVIORS.DEMO && this.y > 600) return this.detonate();

            const clampedX = Math.max(0, Math.min(a.width, this.x + sc));
            if (this.y > state.terrain[Math.floor((clampedX / a.width) * state.terrain.length -1)] - (config.SPRITE_SIZE * config.SCALE_RATIO)) return this.detonate();
        }

        if (this.state === Projectile.STATES.detonation) {
            console.log('boom');
            if (this.behavior === Projectile.BEHAVIORS.DEMO) {
                this.state = Projectile.STATES.stop;
                setTimeout(() => this.state = Projectile.STATES.ready, rand(1000,5000));
            }
        }
    }

    render() {
        switch(this.state) {
            case Projectile.STATES.airtime:
                // head
                const size = config.SPRITE_SIZE * config.SCALE_RATIO;
                const cx = this.x + size / 2;
                const cy = this.y + size / 2;

                c.save();
                c.translate(cx, cy);
                c.rotate(this.angle * Math.PI / 180);
                c.drawImage(this.sprite[0], -size / 2, -size / 2, size, size);
                c.restore();

                // tail
        }
    }

    _flightTime(angle, speed) {
        const maxSteps = 1000;
        let steps = 0;

    }
}