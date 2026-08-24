import { playTrack } from "./audio.js";
import * as match from "./match.js";
import { a,c, cleanCanvas, printFrame, resetCamera } from './canvas.js';
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
let currentPlayerIndex = 0;

const NETWORK_ACTIONS = {
    COLOR_CHANGE: 0,
    START_MATCH: 1
}

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
    resetCamera();
    state.terrain = new Terrain(128, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -3, 3, Math.round(a.height * FOREGROUND_OFFSET), a.width);
    hide($('lobby-owner'));

    if (mpEnabled) {
        $('name').value = state.username;
        $('name').disabled = true;

        Wavedash.on(Wavedash.Events.LOBBY_USERS_UPDATED, refreshPlayers);
        Wavedash.on(Wavedash.Events.LOBBY_MESSAGE, userAction);

        if (state.lobby) {
            const unsubscribeLobbyJoined = Wavedash.on(Wavedash.Events.LOBBY_JOINED, (payload) => {
            console.log(`Joined lobby ${payload.lobbyId}`);
            });
            Wavedash.on(Wavedash.Events.LOBBY_MESSAGE, (payload) => {
            console.log(`${payload.username}: ${payload.message}`);
            });

            Wavedash.joinLobby(state.lobby).then(() => {
                hide($('picker'));
                hide($('start-match'));
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
            console.log('starting match in mp!')
            Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.START_MATCH);
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

    window.updateColor = (e) => {
        let c = hexToRgb(e.target.value);
        // Prevent full black
        if (c.join() === '0,0,0') c = [1,0,0];

        setColor(currentPlayerIndex, c);
        // if mp, send it to other players
        if (mpEnabled) Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.COLOR_CHANGE+','+c.join(','));
    }

    window.updateName = (e) => {
        // option not available in mp
        state.players[currentPlayerIndex].name = e.target.value;
    }

}

function setColor(playerIndex, value) {
    state.players[playerIndex].recolor(state.players[playerIndex].hatColor, value);
    state.players[playerIndex].hatColor = value;
}

function refreshPlayers() {
    const users = Wavedash.getLobbyUsers(state.lobby);

    for (let i = 0; i < 4; i++) {
        const u = users[i];
        if (u?.isHost) {
            show($('lobby-owner'));
            state.players[i].isHost = true;
            $('lobby-owner').innerHTML = `${u.username}'s lobby`;
        }
        state.players[i].name = u?.username ?? uniNames[i];
        state.players[i].id = u?.userId ?? null; // If no id, it's a BOT.
        if (u?.id === Wavedash.getUserId()) {
            currentPlayerIndex = i;
            $('picker').style.marginLeft = `${110 + 100 * i}px`;
        }
    }
}

function userAction(a) {
    switch(a.message[0]) {
        case NETWORK_ACTIONS.COLOR_CHANGE: 
            setColor(state.players.findIndex(p => p.name === a.username), a.message.split(',').splice(1,3));
            break;
        case NETWORK_ACTIONS.START_MATCH:
            return navigateScene(match);
    }
}

export const unload = () => {
    if (mpEnabled) {
        Wavedash.off(Wavedash.Events.LOBBY_USERS_UPDATED, refreshPlayers);
        Wavedash.off(Wavedash.Events.LOBBY_MESSAGE, userAction);
    }
}

//-----------------------------

const parralax = randomPoints(64, Math.round(a.height * BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 2, -10, 1);