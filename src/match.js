import { playTrack, sfx, setVolume } from "./audio.js";
import * as lobby from "./lobby.js";
import { a,c,cleanCanvas, moveCamera, printFrame, resetCamera } from './canvas.js';
import config from "./config.js";
import {randomPoints} from "./utils.js";
import {sky, terrain} from "./scene.js";
import {$,show,hide} from "./utils.js";


const FOREGROUND_OFFSET = 0.75;

export function loop(state) {
    if (state.gameTimer == undefined) {
        state.gameTimer = 0;

        setTimeout(() => setVolume(.1), 500);
        setTimeout(() => sfx(config.S.shot, [1200, 1250], 0.1), 1000);
        setTimeout(() => sfx(config.S.airtime, [1200, 1250], 1.9), 1100);
        setTimeout(() => sfx(config.S.detonation, [60,100], 2), 3000);
        setTimeout(() => setVolume(1), 4000);
        setTimeout(() => {
            moveCamera([500, 500, 800, 450], 200);
        }, 1000);
        setTimeout(() => {
            resetCamera(200);
        }, 4500);
    }


    //clear
    cleanCanvas();
    state.terrain = foreground;

    //sky
    sky(state.t);

    // Foreground
    terrain(foreground, FOREGROUND_OFFSET);

    printFrame();
}

export const nav = [[$('return'), lobby]];

export const hud = $('match');

export const bgm = () => playTrack(config.TRACKS.MATCH_START);

export const load = () => {};
export const unload = () => {};

//-----------------------------

const foreground = randomPoints(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS);
