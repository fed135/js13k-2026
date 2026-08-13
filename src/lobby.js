import { playTrack } from "./audio.js";
import * as match from "./match.js";
import { a,c, cleanCanvas } from './canvas.js';
import Unicorns from "./player.js";
import config from "./config.js";
import { perlin, randomBase, hexToRgb, randomPoints } from "./utils.js";

const FOREGROUND_OFFSET = 0.75;
const BACKGROUND_HEIGHT = 0.45;
const UNI_COUNT = 32;


const pattern = c.createPattern(perlin(), 'repeat');
let playerDemo;
const cyclingUnicorns = [];

const mpEnabled = (window.Wavedash);

export function loop(state) {
    // Init sprites
    if (!playerDemo) {
        playerDemo = new Unicorns(state.assets.unicorn, randomBase(), [255,255,255], 'Player', Unicorns.BEHAVIORS.DEMO);
        playerDemo.x = a.width / 2 - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
        playerDemo.y = a.height * BACKGROUND_HEIGHT - (config.SPRITE_SIZE * config.SCALE_RATIO);
        for (let i = 0; i < UNI_COUNT; i++ ) {
            const uni = new Unicorns(state.assets.unicorn, randomBase(), [255,255,255], '', Unicorns.BEHAVIORS.LOBBY_CYCLE);
            uni.x = i * Math.round(a.width / UNI_COUNT);
            uni.y = (a.height * FOREGROUND_OFFSET) - config.TERRAIN_ROUGHNESS;
            cyclingUnicorns.push(uni);
        }

        state.baseColor = playerDemo.baseColor;
        state.hatColor = playerDemo.hatColor;

        window.updateColor = (e) => {
            let c = hexToRgb(e.target.value);
            // Prevent full black
            if (c.join() === '0,0,0') c = [1,0,0];

            state.hatColor = c;
        }
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

    // Parallax
    c.beginPath();
    c.moveTo(0, Math.round(a.height * BACKGROUND_HEIGHT));
    for (let t = 0; t < parralax.length; t++) {
        const x = Math.round(t * (a.width / parralax.length));
        const y = parralax[t];
        c.lineTo(x, y);
    }
    c.lineTo(a.width, parralax[parralax.length -1]);
    c.lineTo(a.width, a.height);
    c.lineTo(0, a.height);
    c.lineTo(0, Math.round(a.height * BACKGROUND_HEIGHT));
    c.closePath();
    const parallaxGradient = c.createLinearGradient(0, 0, 0, a.height);
    parallaxGradient.addColorStop(0, "white");
    parallaxGradient.addColorStop(1, "#191970");
    c.fillStyle = parallaxGradient;
    c.fill();

    // background
    c.strokeStyle = "black";
    c.lineWidth = 6;
    c.lineCap = 'square';
    c.beginPath();
    c.moveTo(Math.round(a.width * 0.5) - 600, a.height);
    c.lineTo(Math.round(a.width * 0.5) - 250, Math.round(a.height * BACKGROUND_HEIGHT) + 100);
    c.lineTo(Math.round(a.width * 0.5) - 150, Math.round(a.height * BACKGROUND_HEIGHT));
    c.lineTo(Math.round(a.width * 0.5) + 150, Math.round(a.height * BACKGROUND_HEIGHT));
    c.lineTo(Math.round(a.width * 0.5) + 250, Math.round(a.height * BACKGROUND_HEIGHT) + 100);
    c.lineTo(Math.round(a.width * 0.5) + 600, a.height);
    c.closePath();
    const soilGradient = c.createLinearGradient(0, a.height * BACKGROUND_HEIGHT, 0, a.height * FOREGROUND_OFFSET);

    soilGradient.addColorStop(0, "#009900");
    soilGradient.addColorStop(0.1, "#ffcc99");
    soilGradient.addColorStop(0.9, "#8B4513");

    c.fillStyle = soilGradient;
    //c.fillStyle = "#8B4513";
    c.fill();
    c.stroke();

    c.globalCompositeOperation = 'multiply';
    c.fillStyle = pattern;
    c.fill();
    c.globalCompositeOperation = 'source-over';


    // Foreground
    c.beginPath();
    c.moveTo(0, Math.round(a.height * FOREGROUND_OFFSET));
    for (let t = 0; t < terrain.length; t++) {
        const x = Math.round(t * (a.width / terrain.length));
        const y = terrain[t];
        c.lineTo(x, y);
    }
    c.lineTo(a.width, terrain[terrain.length -1]);
    c.lineTo(a.width, a.height);
    c.lineTo(0, a.height);
    c.lineTo(0, Math.round(a.height * FOREGROUND_OFFSET));
    c.closePath();
    const soilGradient2 = c.createLinearGradient(0, a.height * FOREGROUND_OFFSET, 0, a.height);

    soilGradient2.addColorStop(0, "#009900");
    soilGradient2.addColorStop(0.05, "#006633");
    soilGradient2.addColorStop(0.1, "#ffcc99");
    soilGradient2.addColorStop(1, "brown");

    c.fillStyle = soilGradient2;
    c.fill();
    c.stroke();

    c.globalCompositeOperation = 'multiply';
    c.fillStyle = pattern;
    c.fill();
    c.globalCompositeOperation = 'source-over';


    // Player demo
    playerDemo.tick(state);
    playerDemo.render();

    for (let a = 0; a < cyclingUnicorns.length; a++) {
        cyclingUnicorns[a].tick(state);
        cyclingUnicorns[a].render();
    }

}

export const nav = [[document.getElementById('start-match'), match]];

export const hud = document.getElementById('lobby');

export const bgm = () => playTrack(config.TRACKS.LOBBY);

export const load = (state) => {
    if (mpEnabled) {
        document.getElementById('name').value = state.username;

        if (state.lobby) {
            Wavedash.joinLobby(state.lobby).then(() => {
                const users = Wavedash.getLobbyUsers(state.lobby);

                console.log(users);
            });
        }
        else {
            document.getElementById('invite').style.display = 'block';

            Wavedash.createLobby(Wavedash.LobbyVisibility.PRIVATE, 4).then((l) => {
                state.lobby = l.data;

                Wavedash.getLobbyInviteLink(true).then((res) =>  { document.getElementById('invite-link').innerHTML = res.data });
            });
        }
    }
}

export const unload = () => {

}

//-----------------------------

const terrain = randomPoints(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS);
const parralax = randomPoints(64, Math.round(a.height * BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 10, 100, a.height * FOREGROUND_OFFSET);