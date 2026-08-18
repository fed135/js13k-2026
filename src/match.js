import { playTrack, sfx, setVolume, announcer } from "./audio.js";
import * as lobby from "./lobby.js";
import { a,c,cleanCanvas, moveCamera, printFrame, resetCamera } from './canvas.js';
import config from "./config.js";
import {sky} from "./scene.js";
import {$,show,hide, rand} from "./utils.js";
import Rocket from "./rocket.js";
import Projectile from "./projectile.js";
import Rainbow from "./rainbow.js";
import Player from "./player.js";
import Terrain from "./terrain.js";

const FOREGROUND_OFFSET = 0.65;
let input = {};

const mpEnabled = (window.Wavedash);
let currentPlayer;

const preparedShot = {angle: 45, speed: 0};

export function loop() {
    if (state.match.scoreScreen) return;
    if (state.match.gameTimer > config.MAX_MATCH_DURATION) return endMatch();

    //clear
    cleanCanvas();

    //sky
    sky(state.t);

    // Foreground
    state.terrain.render();

    if (!state.match.shotMade && state.match.turnCountdown > 0) {
        $('turn-timer').innerHTML = Math.round((state.match.turnCountdown - Date.now()) / 1000);
        $('current-angle').innerHTML = Math.round(currentPlayer.angle);
        $('current-speed').style.width = `calc(${(currentPlayer.speed / 50) * 100}% - 8px)`;
        $('current-fuel').style.width = `calc(${(state.match.currentPlayerFuel / config.FUEL_PER_TURN) * 100}% - 8px)`;
    
        if (input[32]) {
            currentPlayer.speed = Math.min(currentPlayer.speed + 0.2, 50);
            if (currentPlayer.speed === 50) playerShoot();
        }
        if (input[38] || input[40]) {
            var dir = input[38] ? 1 : -1;
            const newAngle = Math.min(80, Math.max(10, Math.abs(currentPlayer.angle) + dir));
            currentPlayer.angle = (currentPlayer.face * -1) * newAngle;
            
        }
        if (input[37] || input[39]) {
            var dir = input[37] ? -1 : 1;
            currentPlayer.move(dir);
        }
    }

    state.players.forEach((p) => {
        p.tick();
        p.render();
    });

    if (state.match.currentMissile) {
        state.match.currentMissile.tick();
        state.match.currentMissile.render();

        // 540/300
        moveCamera([state.match.currentMissile.x - 270, state.match.currentMissile.y -150, 540, 300], 4);

        if (state.match.currentMissile.state === Projectile.STATES.done) {
            state.match.currentMissile = null;
            setTimeout(endTurn, 500);
        }
    }
    else {
        //resetCamera(60);
        moveCamera([state.players[state.match.currentPlayerTurn].x - 540, state.players[state.match.currentPlayerTurn].y -300, 1080, 600], 20);

    }

    printFrame();
}

export const nav = [[$('return'), lobby]];

export const hud = $('match');

export const bgm = () => playTrack(config.TRACKS.MATCH_START);

export const load = () => {
    state.match = {
        gameTimer: 0,
        currentPlayerTurn: -1,
        turnTimer: null,
        turnCountdown: 0,
        shotMade: false,
        scoreScreen: false,
        currentMissile: null,
        currentPlayerFuel: config.FUEL_PER_TURN,
    }

    // if mp, wait for host to send the terrain coords
    if (mpEnabled) {

    }
    else {
        state.terrain = new Terrain(256, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -6, 6, Math.round(a.height * FOREGROUND_OFFSET), a.width * 2);
    }


    currentPlayer = mpEnabled ? state.players.find(p => p.id === state.id) : state.players[0];

    state.players.forEach((p, i) => {
        p.behavior = Player.BEHAVIORS.PLAYER;
        if (i < 2) p.face *= -1;
        p.x = state.terrain.width * (0.2 * (i + 1)) - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
    });

    endTurn();
};
export const unload = () => {};


function playerShoot() {
    state.match.shotMade = true;
    //if (state.players[state.match.currentPlayerTurn].id )
    // reset hud
    window.onkeyup = () => {};
    window.onkeydown = () => {};
    input = {};
    clearTimeout(state.match.turnTimer);

    let missile = new Rainbow(Projectile.BEHAVIORS.PLAYER);
    missile.fire(state.players[state.match.currentPlayerTurn].x, state.players[state.match.currentPlayerTurn].y, state.players[state.match.currentPlayerTurn].angle, state.players[state.match.currentPlayerTurn].speed);
    state.match.currentMissile = missile;
    missile.owner = state.players[state.match.currentPlayerTurn];
}

function endTurn() {
    // reset hud
    window.onkeyup = () => {};
    window.onkeydown = () => {};
    input = {};

    state.match.gameTimer++;
    state.match.shotMade = false;
    state.match.currentPlayerTurn = (state.match.currentPlayerTurn + 1) % 4;

    if (state.players[state.match.currentPlayerTurn].hp <= 0) {
        if (state.players.filter((p) => p.hp > 0).length > 1) return endTurn();
        else return endMatch();
    }

    state.players[state.match.currentPlayerTurn].speed = 0;
    state.match.currentPlayerFuel = config.FUEL_PER_TURN;
    state.match.turnTimer = setTimeout(endTurn, config.TURN_DURATION);
    state.match.turnCountdown = Date.now() + config.TURN_DURATION;

    announcer(`Player ${state.match.currentPlayerTurn + 1}'s turn`);
    $('announcer').innerHTML = `Player ${state.match.currentPlayerTurn + 1}'s turn`;
    show($('announcer'));
    setTimeout(() => hide($('announcer')), 3000);

    if (mpEnabled ? state.players[state.match.currentPlayerTurn].id === state.id : state.match.currentPlayerTurn === 0) {
        // Our turn, add hud listeners
        window.onkeyup = (e) => {
            input[e.keyCode] = 0;
            if (e.keyCode === 32) playerShoot();
        };
        window.onkeydown = (e) => {
            input[e.keyCode] = 1;
        };
    }

    if (!state.players[state.match.currentPlayerTurn].id) {
        // It's a bot... try to aim...?
        setTimeout(() => {
            state.players[state.match.currentPlayerTurn].angle = rand(20, 60) * state.players[state.match.currentPlayerTurn].face * -1;
            state.players[state.match.currentPlayerTurn].speed = rand(25, 40);

            playerShoot();
        }, rand(3000, 6000));
    }
}

function endMatch() {
    show($('game-over'));
    state.match.scoreScreen = true;
}

