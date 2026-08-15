import { playTrack } from "./audio.js";
import * as match from "./match.js";
import { a,c, cleanCanvas, printFrame } from './canvas.js';
import Unicorns from "./player.js";
import config from "./config.js";
import {sky, terrain, backdrop, mound} from "./scene.js";
import { randomBase, hexToRgb, randomPoints, $ } from "./utils.js";
import Rainbow from './rainbow.js';
import Projectile from "./projectile.js";

const FOREGROUND_OFFSET = 0.75;
const BACKGROUND_HEIGHT = 0.45;
const UNI_COUNT = 32;

let players = [];
const cyclingUnicorns = [];

const mpEnabled = (window.Wavedash);

let demoRocket;

export function loop() {
    //clear
    cleanCanvas();
    state.terrain = foreground;

    sky(state.t);

    // Parallax
    backdrop(parralax, BACKGROUND_HEIGHT);

    demoRocket.tick();
    demoRocket.render();

    // background
    mound(0.2, BACKGROUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.4, BACKGROUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.6, BACKGROUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.8, BACKGROUND_HEIGHT, FOREGROUND_OFFSET );

    // Foreground
    terrain(foreground, FOREGROUND_OFFSET);

    // Player demo
    players.forEach((p) => {
        p.tick();
        p.render();
    });

    for (let a = 0; a < cyclingUnicorns.length; a++) {
        cyclingUnicorns[a].tick();
        cyclingUnicorns[a].render();
    }

    printFrame();
}

export const nav = [[$('start-match'), match]];

export const hud = $('lobby');

export const bgm = () => playTrack(config.TRACKS.LOBBY);

export const load = () => {
    state.windDirection = 0;
    state.windStrength = 0;

    if (mpEnabled) {
        $('name').value = state.username;
        $('name').disabled = true;

        if (state.lobby) {
            Wavedash.joinLobby(state.lobby).then(() => {
                const users = Wavedash.getLobbyUsers(state.lobby);

                console.log(users);
            });
        }
        else {
            $('invite').style.display = 'block';

            Wavedash.createLobby(Wavedash.LobbyVisibility.PRIVATE, 4).then((l) => {
                state.lobby = l.data;

                Wavedash.getLobbyInviteLink(true).then((res) =>  { $('invite-link').value = res.data });
            });

           $('copy-link').addEventListener('click', (e) => {
                navigator.clipboard.writeText($('invite-link').value);
                e.target.nextElementSibling.style.display='block';
           });
        }
    }

    for (let i = 0; i < 4; i++ ) {
        const player = new Unicorns(randomBase(), [255,255,255], 'Player', Unicorns.BEHAVIORS.DEMO);
        player.x = a.width * (0.2 * (i + 1)) - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
        player.y = a.height * BACKGROUND_HEIGHT - (config.SPRITE_SIZE * config.SCALE_RATIO);
        players.push(player);
    }
    
    for (let i = 0; i < UNI_COUNT; i++ ) {
        const uni = new Unicorns([255,255,255], randomBase(), '', Unicorns.BEHAVIORS.LOBBY_CYCLE);
        uni.x = i * Math.round(a.width / UNI_COUNT);
        uni.y = (a.height * FOREGROUND_OFFSET) - config.TERRAIN_ROUGHNESS;
        cyclingUnicorns.push(uni);
    }

    demoRocket = new Rainbow(Projectile.BEHAVIORS.DEMO);

    // TODO: player info storage between scenes
    //state.baseColor = players[0].baseColor;
    //state.hatColor = players[0].hatColor;

    window.updateColor = (e) => {
        let c = hexToRgb(e.target.value);
        // Prevent full black
        if (c.join() === '0,0,0') c = [1,0,0];

        players[0].recolor(players[0].hatColor, c);
        players[0].hatColor = c;
    }

    window.updateName = (e) => {
        // TODO: find actual player
        players[0].name = e.target.value;
    }

}

export const unload = () => {

}

//-----------------------------

const foreground = randomPoints(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS);
const parralax = randomPoints(64, Math.round(a.height * BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 10, 100, a.height * FOREGROUND_OFFSET);