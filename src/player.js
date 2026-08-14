import { applyRecolor, rand } from "./utils.js";
import { osc } from "./canvas.js";
import config from "./config.js";
import {a,c} from "./canvas.js";

export default class Player {

    x = 0;
    y = 0;
    face = 1;
    animationOffset = Math.floor(Math.random() *4);
    frameOffset = [0,0]

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
        FALLING: 6
    }

    static ANIMATION_SPEED = {
        FAST: 20,
        SLOW: 80,
        NEVER: 0xFFFFFFFF,
    }

    constructor(sprite, baseColor, hatColor, name, behavior) {
        this.sprite = osc(sprite.width, sprite.height);
        this.baseColor = baseColor;
        this.hatColor = hatColor;
        this.name = name;
        this.behavior = behavior;

        this.state = null;
    
        // duplicate canvas
        this.sprite[1].drawImage(sprite, 0, 0);

        // draw baseColor
        this.recolor([255,0,0], this.baseColor);
        this.recolor([255,255,255], this.hatColor);
    }

    tick(state) {
        // Logic
        this.checkBehavior(state);
        
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

    checkBehavior(state) {
        switch(this.behavior) {
            case Player.BEHAVIORS.BOT:
                // Check match state, is it our turn ?
                break;
            case Player.BEHAVIORS.DEMO:
                this.changeState(Player.STATES.IDLE);
                this.face = -1;
                /*if (state.hatColor.join() !== this.hatColor.join()) {
                    this.recolor(this.hatColor, state.hatColor);
                    this.hatColor = state.hatColor;
                }*/
                break;
            case Player.BEHAVIORS.LOBBY_CYCLE:
                // set to walking, advance on terrain
                this.changeState(Player.STATES.WALKING);
                this.y = state.terrain[Math.floor(((this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) / 2) / a.width) * state.terrain.length)] - (config.SPRITE_SIZE * config.SCALE_RATIO);
                this.x += rand(1.4, 1.5);
                if (this.x > a.width + (config.SPRITE_SIZE * config.SCALE_RATIO)) this.x = -(config.SPRITE_SIZE * config.SCALE_RATIO)
                break;

            case Player.BEHAVIORS.PLAYER:
                // Check match state, is it our turn ? Are there inputs
                break;
        }
    }

    render() {
        c.save();
        c.translate(a.width * 0.5, 0);
        c.scale(this.face,1);
        c.translate(-a.width * 0.5, 0);
            
        c.drawImage(
            this.sprite[0],
            this.frameOffset[0] * config.SPRITE_SIZE,
            this.frameOffset[1] * config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            this.x,
            this.y,
            config.SPRITE_SIZE * config.SCALE_RATIO,
            config.SPRITE_SIZE * config.SCALE_RATIO
        );
        c.restore();

        // Display name (should probably render once in an osc)
        c.textAlign = 'center';
        c.fillText(this.name, this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y - 16);
    }
}