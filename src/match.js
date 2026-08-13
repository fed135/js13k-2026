import { playTrack, sfx, setVolume } from "./audio.js";
import * as lobby from "./lobby.js";
import { a,c,cleanCanvas } from './canvas.js';
import config from "./config.js";
import {randomPoints} from "./utils.js";

const FOREGROUND_OFFSET = 0.75;

export function loop(state) {
    if (state.gameTimer == undefined) {
        state.gameTimer = 0;

        setTimeout(() => setVolume(.1), 500);
        setTimeout(() => sfx(config.S.shot, [1200, 1250], 0.1), 1000);
        setTimeout(() => sfx(config.S.airtime, [1200, 1250], 1.9), 1100);
        setTimeout(() => sfx(config.S.detonation, [60,100], 2), 3000);
        setTimeout(() => setVolume(1), 4000);
    }


    //clear
    cleanCanvas();
    state.terrain = terrain;

    //sky
    const gradient = c.createRadialGradient(state.t * 0.2, 90, 30, state.t * 0.2, 100, a.width);
    
    gradient.addColorStop(0, "#FAFAD2");
    gradient.addColorStop(0.05, "white");
    gradient.addColorStop(0.25, "#F0FFFF");
    gradient.addColorStop(0.5, "#87CEFA");
    gradient.addColorStop(1, "#191970");
    
    c.fillStyle = gradient;
    c.fillRect(0,0,a.width, a.height);
}

export const nav = [[document.getElementById('return'), lobby]];

export const hud = document.getElementById('match');

export const bgm = () => playTrack(config.TRACKS.MATCH_START);

//-----------------------------

const terrain = randomPoints(256, );
