import { playTrack } from "./audio.js";
import * as match from "./match.js";
import { a,c, cleanCanvas, printFrame } from './canvas.js';
import Unicorns from "./player.js";
import config from "./config.js";
import {sky, backdrop, mound} from "./scene.js";
import { randomBase, hexToRgb, randomPoints, $, hide, show, rand } from "./utils.js";
import Rainbow from './rainbow.js';
import Projectile from "./projectile.js";
import Terrain from "./terrain.js";

const FOREGROUND_OFFSET = 0.8;
const BACKGROUND_HEIGHT = 0.3;
const MOUND_HEIGHT = 0.55;
const UNI_COUNT = 32;

const cyclingUnicorns = [];

const mpEnabled = (window.Wavedash);

let uniNames = ['Player', 'BOT Dolly', 'BOT Jolly', 'BOT Denis'];

let demoRockets = [];

export function loop() {
    //clear
    cleanCanvas();

    sky(state.t);

    // Parallax
    backdrop(parralax, BACKGROUND_HEIGHT);

    demoRockets.forEach((d) => {
        d.tick();
        d.render();
    });

    // background
    mound(0.2, MOUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.4, MOUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.6, MOUND_HEIGHT, FOREGROUND_OFFSET );
    mound(0.8, MOUND_HEIGHT, FOREGROUND_OFFSET );

    // Foreground
    state.terrain.render();

    // Player demo
    state.players.forEach((p) => {
        p.tick();
        p.render();
    });

    cyclingUnicorns.forEach((u) => {
        u.tick();
        u.render();
    });

    printFrame();
}

export const nav = [[$('start-match'), match]];

export const hud = $('lobby');

export const bgm = () => playTrack(config.TRACKS.LOBBY);

export const load = () => {
    state.windDirection = 0;
    state.windStrength = 0;
    state.players = [];
    state.terrain = new Terrain(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -3, 3, Math.round(a.height * FOREGROUND_OFFSET), a.width);
    hide($('lobby-owner'));

    if (mpEnabled) {
        $('name').value = state.username;
        $('name').disabled = true;

        if (state.lobby) {
            Wavedash.joinLobby(state.lobby).then(() => {
                const users = Wavedash.getLobbyUsers(state.lobby);

                hide($('picker'));
                hide($('start-match'));
                users.forEach((u, i) => {
                    if (u.isHost) {
                        show($('lobby-owner'));
                        $('lobby-owner').innerHTML = `${u.username}'s lobby`;
                    }
                    state.players[i].name = u.username;
                    state.players[i].id = u.userId; // If no id, it's a BOT.
                });

                const message = Wavedash.readP2PMessageFromChannel(0);
                if (message) {
                    console.log(`From: ${message.fromUserId}, Data: ${message.payload}`);
                    navigateScene(match);
                }
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

        $('start-match').addEventListener((e) => {
            Wavedash.broadcastP2PMessage(0, true, new Uint8Array([1, 2, 3]));
        });
    }

    for (let i = 0; i < 4; i++ ) {
        const player = new Unicorns(randomBase(), [rand(128,255),rand(128,255),rand(128,255)], uniNames[i], Unicorns.BEHAVIORS.DEMO);
        player.x = a.width * (0.2 * (i + 1)) - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
        player.y = a.height * MOUND_HEIGHT - (config.SPRITE_SIZE * config.SCALE_RATIO);
        if (!mpEnabled && i === 0) player.id = 1;
        state.players.push(player);
    }
    
    for (let i = 0; i < UNI_COUNT; i++ ) {
        const uni = new Unicorns([255,255,255], randomBase(), '', Unicorns.BEHAVIORS.LOBBY_CYCLE);
        uni.x = i * Math.round(a.width / UNI_COUNT);
        uni.y = (a.height * FOREGROUND_OFFSET) - config.TERRAIN_ROUGHNESS;
        cyclingUnicorns.push(uni);
    }

    for (let i = 0; i < 8; i++ ) {
        demoRockets.push(new Rainbow(Projectile.BEHAVIORS.DEMO));
    }

    // TODO: player info storage between scenes
    //state.baseColor = players[0].baseColor;
    //state.hatColor = players[0].hatColor;

    window.updateColor = (e) => {
        let c = hexToRgb(e.target.value);
        // Prevent full black
        if (c.join() === '0,0,0') c = [1,0,0];

        state.players[0].recolor(state.players[0].hatColor, c);
        state.players[0].hatColor = c;
    }

    window.updateName = (e) => {
        // TODO: find actual player
        state.players[0].name = e.target.value;
    }

}

export const unload = () => {

}

//-----------------------------

const parralax = randomPoints(64, Math.round(a.height * BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 2, -10, 1);