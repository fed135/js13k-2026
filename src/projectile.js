import { osc,a,c } from "./canvas.js";
import config from "./config.js";
import { rand, updateBallistic } from "./utils.js";

const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

export default class Projectile {
    static STATES= {
        ready: 0,
        airtime: 1,
        fallout: 3,
        aim: 4,
        done: 5
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
        this.x = x;
        this.y = y;
        this.state = Projectile.STATES.airtime;
        //this.momentum = this.weight * speed;
        this.angle = angle * Math.PI / 180;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = -Math.sin(this.angle) * speed;
        this.tail = [];
    }

    detonate() {
        this.state = Projectile.STATES.fallout;

        if (this.behavior !== Projectile.BEHAVIORS.DEMO) {
            const clampedX = Math.max(0, Math.min(a.width, this.x + sc));

            // Apply reduction to surrounding terrain as well
            state.terrain[Math.floor((clampedX / a.width) * state.terrain.length -1)] += (this.falloff * 0.5)
        }
        
    }

    tick() {
        if (this.behavior === Projectile.BEHAVIORS.DEMO && this.state === Projectile.STATES.ready) {
            this.state = Projectile.STATES.aim;
            setTimeout(() => this.fire(0, 400, rand(30, 50), rand(25, 35)), rand(1000,5000));
            
        }


        if (this.state === Projectile.STATES.airtime) {
            this.tail.push([this.x, this.y]);
            if (this.tail.length > this.tailLength) this.tail.shift();

            updateBallistic(this, state.windDirection, state.windStrength, state.gravity);

            if (this.behavior === Projectile.BEHAVIORS.DEMO && this.y > 600) return this.detonate();

            const clampedX = Math.max(0, Math.min(a.width, this.x + sc));
            if (this.y > state.terrain[Math.floor((clampedX / a.width) * state.terrain.length -1)] - (config.SPRITE_SIZE * config.SCALE_RATIO)) return this.detonate();
        }

        if (this.state === Projectile.STATES.fallout) {
            if (this.tail.length === 0) {
                this.state = this.behavior === Projectile.BEHAVIORS.DEMO ? Projectile.STATES.ready : Projectile.STATES.done;
            }
        }
    }

    render() {
        const size = config.SPRITE_SIZE * config.SCALE_RATIO;
        const cx = this.x + size / 2;
        const cy = this.y + size / 2;

        // tail
        c.moveTo(cx, cy);
        for (let t = 0; t < this.tail.length; t++) {
            c.beginPath();
            c.strokeStyle = `rgba(${this.tailColor.join()}, ${1 / (this.tail.length - t)})`;
            c.lineTo(this.tail[t][0] + size / 2, this.tail[t][1] + size / 2);
            c.stroke();
        }

        switch(this.state) {
            case Projectile.STATES.airtime:
                
                // head
                c.save();
                c.translate(cx, cy);
                c.rotate(this.angle * Math.PI / 180);
                c.drawImage(this.sprite[0], -size / 2, -size / 2, size, size);
                c.restore();

                break;
            case Projectile.STATES.aim:
                if (this.behavior !== Projectile.BEHAVIORS.DEMO) {
                    c.moveTo(cx, cy);
                    c.arcTo();
                }
                break;
            case Projectile.STATES.fallout: 
                c.beginPath();
                c.arc(cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff, 0, 2 * Math.PI);
                const explosionRadial = c.createRadialGradient(cx, cy, 1, cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff);
                explosionRadial.addColorStop(0, `rgba(${this.tailColor.join()}, 0.8)`);
                explosionRadial.addColorStop(1, `rgba(${this.tailColor.join()}, 0.01)`);
                c.fillStyle = explosionRadial;

                c.save();
                c.globalAlpha =  (this.tail.length / this.tailLength);
                c.fill();
                c.restore();
                
                this.tail.shift();
                break;
        }

        c.strokeStyle = 'black';
    }

    _flightTime(angle, speed) {
        const maxSteps = 10000;
        let steps = 0;
        let test = {x: this.x, y: this.y, weight: this.weight};
        test.angle = angle * Math.PI / 180;
        test.vx = Math.cos(test.angle) * speed;
        test.vy = -Math.sin(test.angle) * speed;

        for (;steps < maxSteps; steps++) {
            updateBallistic(test, state.windDirection, state.windStrength, state.gravity);

            const clampedX = Math.max(0, Math.min(a.width, test.x + sc));
            const index = Math.min(state.terrain.length - 1, Math.floor((clampedX / a.width) * state.terrain.length));
            if (test.y > state.terrain[index] - (config.SPRITE_SIZE * config.SCALE_RATIO)) {
                return steps;
            }
        }
        return maxSteps;
    }
}