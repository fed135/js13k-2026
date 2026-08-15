import { playTrack, sfx, setVolume } from "./audio.js";
import * as lobby from "./lobby.js";
import { a,c,cleanCanvas, moveCamera, printFrame, resetCamera } from './canvas.js';
import config from "./config.js";
import {randomPoints} from "./utils.js";
import {sky, terrain} from "./scene.js";
import {$,show,hide} from "./utils.js";
import Rocket from "./rocket.js";
import Projectile from "./projectile.js";
import Rainbow from "./rainbow.js";


const FOREGROUND_OFFSET = 0.75;

let missile;

export function loop() {
    if (state.gameTimer == undefined) {
        state.gameTimer = 0;
        missile = new Rainbow(Projectile.BEHAVIORS.PLAYER);

        setTimeout(() => missile.fire(0, 400, 45, 30), 1000);
    }

    //clear
    cleanCanvas();
    state.terrain = foreground;

    //sky
    sky(state.t);

    // Foreground
    terrain(foreground, FOREGROUND_OFFSET);

    missile.tick();
    missile.render();

    moveCamera([missile.x, missile.y, 800, 450], 200);

    printFrame();
}

export const nav = [[$('return'), lobby]];

export const hud = $('match');

export const bgm = () => playTrack(config.TRACKS.MATCH_START);

export const load = () => {};
export const unload = () => {};

//-----------------------------

const foreground = randomPoints(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS);
