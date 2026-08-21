import { osc,a,c } from "./canvas.js";
import config from "./config.js";
import { rand, updateBallistic, distance } from "./utils.js";
import { sfx, setVolume, announcer } from "./audio.js";


const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

const particles = [];

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
        PARTICLE: 2,
    }

    constructor(head, tailColor, tailLength, damage, falloff, weight, behavior) {
        if(head) {
            this.sprite = osc(config.SPRITE_SIZE, config.SPRITE_SIZE);
            this.sprite[1].drawImage(head, 0, 0);
        }

        this.x = 0;
        this.y = 0;
        this.angle = 45;
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
        this.lifetime = 0;

        this.behavior = behavior;
        this.state = Projectile.STATES.ready;
    }

    aim(angle, speed) {
        // Print dotted trajectory
    }

    fire(x, y, angle, speed) {
        this.x = x;
        this.y = y - sc;

        this.state = Projectile.STATES.airtime;
        //this.momentum = this.weight * speed;
        this.angle = (angle < 0 ? angle + 180 : angle) * Math.PI / 180;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = -Math.sin(this.angle) * speed;
        this.tail = [];

        if (this.behavior === Projectile.BEHAVIORS.PLAYER) {
            setVolume(0.1);
            sfx(config.S.shot, [1200, 1250], 0.1);
        
            const airtime = this._flightTime(angle, speed);
            sfx(config.S.airtime, [1200, 1250], airtime/100);
        }
    }

    detonate(offset) {
        this.state = Projectile.STATES.fallout;

        if (this.behavior === Projectile.BEHAVIORS.PLAYER) {
            Projectile.particleSystem(this.x, this.y + sc, [32,0,0], 50, 500);

            state.terrain.crater(this.x + sc, this.falloff, offset);
            sfx(config.S.detonation, [60,100], 2);
            setTimeout(() => setVolume(1), 4);
        


            // Apply damage
            state.players.forEach((p) => {
                if (p.hp > 0) {
                    const dist = distance(this.x + sc, this.y + sc, p.x + sc, p.y + sc);
                    if (dist < this.falloff) {
                        const dmg = Math.ceil((1- (dist / this.falloff)) * this.damage);
                        p.hp = Math.max(0, p.hp - dmg);
                        if (p.hp === 0) {
                            //expode!
                            Projectile.particleSystem(p.x, p.y + sc, [255,0,0], 100, 1000);
                        }
                    }
                }
            });
        }
        
    }

    tick() {
        this.lifetime = ++this.lifetime % 0xffffffff;

        if (this.behavior === Projectile.BEHAVIORS.DEMO && this.state === Projectile.STATES.ready) {
            this.state = Projectile.STATES.aim;
            setTimeout(() => this.fire(0, 350, rand(30, 50), rand(21, 32)), rand(1000,5000));
        }

        if (this.state === Projectile.STATES.airtime) {
            this.tail.push([this.x, this.y]);
            if (this.tail.length > this.tailLength) this.tail.shift();

            updateBallistic(this, state.windDirection, state.windStrength, state.gravity);

            if (this.behavior === Projectile.BEHAVIORS.DEMO && this.y > 600) return this.detonate();

            // Detect out of area
            if (this.x + sc < 0 || this.x + sc > state.terrain.width) {
                this.state = Projectile.STATES.fallout;
                return;
            }

            const terrainY = state.terrain.getCurrentY(this.x + sc);
            if (this.y + sc > terrainY) return this.detonate();

            // TODO detect collision with other players!
            for (let i = 0; i < state.players.length; i++) {
                if (state.players[i] !== this.owner) {
                    const p = state.players[i];
                    if (this.x + sc > p.x + config.SPRITE_SIZE && this.y + sc > p.y + config.SPRITE_SIZE && this.x + sc < p.x + sc * 2 && this.y + sc < p.y + sc * 2) {
                        return this.detonate(true);
                    }
                }
            }
        }

        if (this.state === Projectile.STATES.fallout) {
            this.tail.shift();
            if (this.tail.length === 0) {
                this.state = this.behavior === Projectile.BEHAVIORS.DEMO ? Projectile.STATES.ready : Projectile.STATES.done;
            }
        }

        if (this.behavior === Projectile.BEHAVIORS.PARTICLE && this.lifetime > 1000) {
            particles.shift();
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
            c.strokeStyle = `rgba(${this.tailColor.join()}, ${0.9 / (this.tailLength - t)})`;
            c.lineTo(this.tail[t][0] + size / 2, this.tail[t][1] + size / 2);
            c.stroke();
        }

        if (this.behavior === Projectile.BEHAVIORS.PARTICLE) return;

        switch(this.state) {
            case Projectile.STATES.airtime:
                if (this.sprite) {
                    // head
                    c.save();
                    c.translate(cx, cy);
                    c.rotate(this.angle * Math.PI / 180);
                    c.drawImage(this.sprite[0], -size / 2, -size / 2, size, size);
                    c.restore();
                }
                break;
            case Projectile.STATES.fallout: 
                c.beginPath();
                c.arc(cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff, 0, 2 * Math.PI);
                const explosionRadial = c.createRadialGradient(cx, cy, 1, cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff);
                explosionRadial.addColorStop(0.1, `rgba(${this.tailColor.join()}, 0.9)`);
                explosionRadial.addColorStop(1, `rgba(${this.tailColor.join()}, 0.01)`);
                c.fillStyle = explosionRadial;

                c.save();
                c.globalAlpha =  (this.tail.length / this.tailLength);
                c.fill();
                c.restore();
                
                break;
        }
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

            const terrainY = state.terrain.getCurrentY(this.x + sc);
            if (test.y > terrainY) {
                return steps;
            }
        }
        return maxSteps;
    }

    static particleSystem(x, y, color, num, speed) {
        for (let i = 0; i < num; i++) {
            setTimeout(() => {
                const p = new Projectile(null, color, 100, 0, 0, 20, Projectile.BEHAVIORS.PARTICLE);
                p.fire(x, y, rand(0, 180), rand(10, 20));
                particles.push(p);
            }, (speed/num) * i);
        }
    }

    static renderParticles() {
        c.lineWidth = 4;
        particles.forEach((p) => {
            p.tick();
            p.render();
        });
    }
}