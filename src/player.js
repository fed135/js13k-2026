import { applyRecolor, rand, $ } from "./utils.js";
import { osc } from "./canvas.js";
import config from "./config.js";
import {a,c} from "./canvas.js";
import Rocket from "./rocket.js";
import Grenade from "./grenade.js";
import Bullet from "./bullet.js";
import Rainbow from "./rainbow.js";

const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

export default class Player {

    x = 0;
    y = 0;
    face = 1;
    animationOffset = Math.floor(Math.random() *4);
    frameOffset = [0,0]
    speed = 0;
    angle = 45;
    ammo = [Infinity, 3, 3, 1];
    weapons = [Rocket, Grenade, Bullet, Rainbow];
    currentWeapon = 0;
    playing = false;

    static BEHAVIORS = {
        DEMO: 0,
        LOBBY_CYCLE: 1,
        PLAYER: 2,
        BOT: 3
    }

    static STATES = {
        IDLE: 0,
        WALKING: 1,
        AIMING: 2,
        DAMAGE: 3,
        VICTORY: 4,
        DEAD: 5,
        DYING: 7,
    }

    static ANIMATION_SPEED = {
        FAST: 20,
        SLOW: 80,
        NEVER: 0xFFFFFFFF,
    }

    constructor(baseColor, hatColor, name, behavior) {
        this.sprite = osc(window.assets.unicorn.width, window.assets.unicorn.height);
        this.baseColor = baseColor;
        this.hatColor = hatColor;
        this.name = name;
        this.behavior = behavior;
        this.hp = 100;
        this.currentFuel = config.FUEL_PER_TURN;

        this.state = null;
    
        // duplicate canvas
        this.sprite[1].drawImage(window.assets.unicorn, 0, 0);

        // draw baseColor
        this.recolor([255,0,0], this.baseColor);
        this.recolor([255,255,255], this.hatColor);
    }

    tick() {
        // Check falling
        if (this.behavior !== Player.BEHAVIORS.DEMO) {
            const terrainY = state.terrain.getCurrentY(this.x + sc);
            
            if (this.y < terrainY - (config.SPRITE_SIZE * config.SCALE_RATIO)) {
                if (this.behavior !== Player.BEHAVIORS.LOBBY_CYCLE) {
                    this.y += 7;
                    return;
                }
            }
            this.y = terrainY - (config.SPRITE_SIZE * config.SCALE_RATIO);
        }

        // Logic
        this.checkBehavior();
        
        // Animations
        switch(this.state) {
            case Player.STATES.WALKING:
                this.frameOffset[1] = 1;
                this.animationStep(state.t, Player.ANIMATION_SPEED.FAST);
                break; 
            case Player.STATES.IDLE:
                this.frameOffset[1] = 0;
                this.animationStep(state.t, Player.ANIMATION_SPEED.SLOW);
                break;
            case Player.STATES.DEAD:
                this.frameOffset[1] = 3;
                this.frameOffset[0] = 0;
                break;
            case Player.STATES.AIMING:
                this.frameOffset[1] = 0;
                this.animationStep(state.t, Player.ANIMATION_SPEED.NEVER);
                break;
            case Player.STATES.VICTORY:
                this.frameOffset[1] = 3;
                this.frameOffset[0] = 1;
                break;
            default: 
                
        }
    }

    recolor(from, to) {
        const baseData = this.sprite[1].getImageData(0, 0, this.sprite[0].width, this.sprite[0].height);
        applyRecolor(baseData, from, to);
        this.sprite[1].putImageData(baseData, 0, 0);
    }

    // Sort of reset
    changeState(to) {
        if (this.state !== to) {
            this.state = to;
            this.frameOffset[0] = this.animationOffset;
        }
    }

    animationStep(t, speed) {
        if (t % speed === 0) this.frameOffset[0]++;
        if (this.frameOffset[0] > 3) this.frameOffset[0] = 0;
    }

    checkBehavior() {
        switch(this.behavior) {
            case Player.BEHAVIORS.BOT:
                // Check match state, is it our turn ?
                break;
            case Player.BEHAVIORS.DEMO:
                this.changeState(Player.STATES.IDLE);
                
                /*if (state.hatColor.join() !== this.hatColor.join()) {
                    this.recolor(this.hatColor, state.hatColor);
                    this.hatColor = state.hatColor;
                }*/
                break;
            case Player.BEHAVIORS.LOBBY_CYCLE:
                // set to walking, advance on terrain
                this.changeState(Player.STATES.WALKING);
                this.face = -1;

                this.x += rand(1.4, 1.5);
                if (this.x > a.width + (config.SPRITE_SIZE * config.SCALE_RATIO)) this.x = -(config.SPRITE_SIZE * config.SCALE_RATIO)
                break;

            case Player.BEHAVIORS.PLAYER:
                // Check match state, is it our turn ? Are there inputs
                if (this.hp <= 0) this.state = Player.STATES.DEAD;
                break;
        }
    }
    
    move(dir) {
        if (dir === 0) {
            this.changeState(Player.STATES.IDLE);
        }

        if (this.currentFuel > 0) {
            this.x = Math.min(state.terrain.width, Math.max(0, this.x + dir));
            this.currentFuel--;
        }
        const newFace = dir * -1;
        if (newFace !== this.face) this.angle *= -1;
        this.face = newFace;
        this.changeState(Player.STATES.WALKING);
    }

    render() {
        const size = config.SPRITE_SIZE * config.SCALE_RATIO;
        const cx = this.x + size / 2;
        const cy = this.y + size / 2;

        c.strokeStyle = 'black';
        c.lineWidth = 4;
        c.lineJoin = "round";

        c.save();
        c.translate(cx, cy);
        c.scale(this.face, 1);
        c.drawImage(
            this.sprite[0],
            this.frameOffset[0] * config.SPRITE_SIZE,
            this.frameOffset[1] * config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            -size / 2,
            -size / 2,
            config.SPRITE_SIZE * config.SCALE_RATIO,
            config.SPRITE_SIZE * config.SCALE_RATIO
        );
        if (this.playing && this.state !== Player.STATES.VICTORY) {
            c.beginPath();
            c.moveTo(-size / 2, 0);
            c.arc(-size / 2, 0, size, 190 * Math.PI / 180, 260 * Math.PI / 180, false);
            c.closePath();
            c.globalAlpha = 0.4;
            c.fillStyle = 'white';
            c.fill();
            c.strokeStyle = 'grey';
            c.globalAlpha = 1;
            c.lineWidth = 1;
            c.stroke();
            c.lineWidth = 4;
            c.strokeStyle = 'blue';
            c.beginPath();
            c.moveTo(-size / 2, 0);
            c.lineTo(-size / 2 + Math.cos((this.angle < 0 ? this.angle *-1 +180 : this.angle + 180) * Math.PI / 180) * size, Math.sin((this.angle < 0 ? this.angle * -1 +180: this.angle + 180) * Math.PI / 180) * size);
            c.stroke();
        }
        c.restore();

        // hpbar
        if (this.behavior === Player.BEHAVIORS.PLAYER && this.hp > 0) {
            c.strokeRect(this.x, this.y - 8, (config.SPRITE_SIZE * config.SCALE_RATIO), 9);
            c.fillStyle = 'red';
            c.fillRect(this.x, this.y - 8, (this.hp/100) * (config.SPRITE_SIZE * config.SCALE_RATIO), 9);
        }

        // Display name (should probably render once in an osc)
        c.textAlign = 'center';
        c.font = 'normal bolder 18px sans-serif';
        c.fillStyle = this.hp > 0 ? 'white' : '#333';
        
        c.strokeText(this.name, this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y + (this.hp > 0 ? -16 : 16));
        c.fillText(this.name, this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y + (this.hp > 0 ? -16 : 16));

        if (this.playing && this.state !== Player.STATES.VICTORY) {
            c.beginPath();
            c.moveTo(this.x + 24, this.y - 54);
            c.lineTo(this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) - 24, this.y - 54);
            c.lineTo(this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y - 36);
            c.closePath();
            c.fillStyle = 'green';
            c.fill();
            c.fillStyle = 'black';
            c.fillText(Math.round((state.match.turnCountdown - Date.now()) / 1000), this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y -64);
        }
    }

    changeWeapon(dir) {
        this.currentWeapon += dir;
        if (this.currentWeapon < 0) this.currentWeapon = 3;
        if (this.currentWeapon > 3) this.currentWeapon = 0;

        $('weapon-icon').innerHTML = this.weapons[this.currentWeapon].icon;
        $('current-ammo').innerHTML = this.ammo[this.currentWeapon];
    }
}