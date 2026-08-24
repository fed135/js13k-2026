import { playTrack, sfx, setVolume, announcer } from "./audio.js";
import * as lobby from "./lobby.js";
import { a,c,cleanCanvas, moveCamera, printFrame, resetCamera, ctx } from './canvas.js';
import config from "./config.js";
import {sky, backdrop} from "./scene.js";
import {$,show,hide, rand, randomPoints} from "./utils.js";
import Rocket from "./rocket.js";
import Projectile from "./projectile.js";
import Rainbow from "./rainbow.js";
import Player from "./player.js";
import Terrain from "./terrain.js";

const FOREGROUND_OFFSET = 0.65;
const BACKGROUND_HEIGHT = 0.3;

let input = {};

const mpEnabled = (window.Wavedash);
let currentPlayer;
let winnerSpectacle;

const NETWORK_ACTIONS = {
    INIT: 10,
    END_TURN: 11,
    SHOT: 12,
    WIND_CHANGE: 13,
    MOVE: 14
}


export function loop() {
    //clear
    cleanCanvas();

    //sky
    sky(state.t);

    backdrop(parralax, BACKGROUND_HEIGHT);

    // Foreground
    state.terrain.render();

    if (!state.match.shotMade && state.match.turnCountdown > 0) {
        $('current-angle').innerHTML = Math.round(currentPlayer.angle);
        $('current-speed').style.width = `calc(${(currentPlayer.speed / 50) * 100}% - 8px)`;
        $('current-fuel').style.width = `calc(${(state.match.currentPlayerFuel / config.FUEL_PER_TURN) * 100}% - 8px)`;
    
        if (input[32]) {
            if (currentPlayer.ammo[currentPlayer.currentWeapon] > 0) {
                currentPlayer.speed = Math.min(currentPlayer.speed + 0.2, 50);
                if (currentPlayer.speed === 50) playerShoot();
            }
        }
        if (input[38] || input[40]) {
            var dir = input[38] ? 1 : -1;
            const newAngle = Math.min(80, Math.max(10, Math.abs(currentPlayer.angle) + dir));
            currentPlayer.angle = (currentPlayer.face * -1) * newAngle;
        }
        if (input[37] || input[39]) {
            var dir = input[37] ? -1 : 1;
            currentPlayer.move(dir);

            if (mpEnabled && state.t % 10 === 0) Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.MOVE},${currentPlayer.x}`);
        }
        if (!input[37] && !input[39]) currentPlayer.changeState(Player.STATES.IDLE);
    }

    state.players.forEach((p) => {
        p.playing = state.players[state.match.currentPlayerTurn] === p && !state.match.shotMade;
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

    Projectile.renderParticles();

    printFrame();

    // wind direction
    ctx.save();
    ctx.translate(540, 40);
    ctx.rotate((state.windDirection + 90) * (Math.PI / 180));
    ctx.beginPath();
    ctx.moveTo(0,-14);
    ctx.lineTo(12,14);
    ctx.lineTo(-12,14);
    ctx.closePath();
    const windGRadient = ctx.createLinearGradient(0, 0, -14, 30);
    windGRadient.addColorStop(0, "lightblue");
    windGRadient.addColorStop(1, "blue");
    ctx.fillStyle = windGRadient;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = 'normal bolder 16px sans-serif';
    ctx.fillStyle = '#999';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.lineJoin = "round";
            
    ctx.strokeText(Math.round(state.windStrength), 540, 20);
    ctx.fillText(Math.round(state.windStrength), 540, 20);
}

export const nav = [];

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

    state.terrain = new Terrain(256, Math.round(a.height * FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -6, 6, Math.round(a.height * FOREGROUND_OFFSET), a.width * 2);

    currentPlayer = mpEnabled ? state.players.find(p => p.id === state.id) : state.players[0];

    $('prev-weapon').addEventListener('click', () => currentPlayer.changeWeapon(-1));
    $('next-weapon').addEventListener('click', () => currentPlayer.changeWeapon(1));

    state.players.forEach((p, i) => {
        p.behavior = Player.BEHAVIORS.PLAYER;
        if (i < 2) p.face *= -1;
        p.x = state.terrain.width * (0.2 * (i + 1)) - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
        p.index = i;
    });

    // if mp, wait for host to send the terrain coords
    if (mpEnabled) {
        Wavedash.on(Wavedash.Events.LOBBY_MESSAGE, userAction);

        if (currentPlayer.isHost) {
            Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.INIT},${JSON.stringify(state.terrain.coords)}`);
        }
    }
    else {
        // start the game
        endTurn();
    }
};
export const unload = () => {
    clearInterval(winnerSpectacle);
    Wavedash.off(Wavedash.Events.LOBBY_MESSAGE, userAction);
};

function userAction(a) {
    console.log('Network message', a);
     switch(a.message[0]) {
            case NETWORK_ACTIONS.INIT: 
                state.terrain.coords = JSON.parse(a.message.substring(2));
                break;
            case NETWORK_ACTIONS.END_TURN:
                endTurn(true); //noloop
                break;
            case NETWORK_ACTIONS.MOVE:
                state.players.find((p) => p.name === a.username).x = Number(a.message.substring(2));
                break;
            case NETWORK_ACTIONS.WIND_CHANGE:
                const newWind = a.message.split(',');
                state.windDirection = Number(newWind[1]);
                state.windStrength = Number(newWind[2]);
                break;
            case NETWORK_ACTIONS.SHOT:
                const shot = a.message.split(',');
                const from = state.players.find((p) => p.name === a.username);
                from.currentWeapon = shot[1];
                from.x = shot[2];
                from.y = shot[3];
                from.angle = shot[4];
                from.speed = shot[5];
                playerShoot(true); //noloop
        }
}

function playerShoot(noloop) {
    state.match.shotMade = true;
    //if (state.players[state.match.currentPlayerTurn].id )
    // reset hud
    window.onkeyup = () => {};
    window.onkeydown = () => {};
    input = {};
    clearTimeout(state.match.turnTimer);

    const cp = state.players[state.match.currentPlayerTurn];
    let missile = new cp.weapons[cp.currentWeapon](Projectile.BEHAVIORS.PLAYER);
    missile.fire(cp.x, cp.y, cp.angle, cp.speed);
    state.match.currentMissile = missile;
    missile.owner = cp;
    cp.ammo[cp.currentWeapon]--;

    if (cp === currentPlayer) $('last-shot').style.marginLeft = `calc(${(currentPlayer.speed / 50) * 100}% - 8px)`;
    if (mpEnabled && !noloop) Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.SHOT},${cp.currentWeapon},${cp.x},${cp.y},${cp.angle},${cp.speed}`);
}

function endTurn(noloop) {
    // reset hud
    window.onkeyup = () => {};
    window.onkeydown = () => {};
    input = {};
    currentPlayer.changeState(Player.STATES.IDLE);

    // if host, communicate end of turn to others
    if (mpEnabled && currentPlayer.isHost && !noloop) Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.END_TURN);

    if (state.match.gameTimer >= config.MAX_MATCH_DURATION) return endMatch();

    state.match.gameTimer++;
    state.match.shotMade = false;
    state.match.currentPlayerTurn = (state.match.currentPlayerTurn + 1) % 4;

    if (state.players[state.match.currentPlayerTurn].hp <= 0) {
        if (state.players.filter((p) => p.hp > 0).length > 1) return endTurn();
        else return endMatch();
    }

    if (state.match.gameTimer === 1 || (state.match.gameTimer +1) % 4 === 0) {
        sfx(config.S.shot, [300, 400], 5);
        state.windDirection = Math.round(rand(0, 180));
        state.windStrength = Math.round(rand(0, 30));
        if (mpEnabled && currentPlayer.isHost) Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.WIND_CHANGE},${state.windDirection},${state.windStrength}`);
    }
    state.players[state.match.currentPlayerTurn].speed = 0;
    state.match.currentPlayerFuel = config.FUEL_PER_TURN;
    if ((mpEnabled && currentPlayer.isHost) || !mpEnabled)state.match.turnTimer = setTimeout(endTurn, config.TURN_DURATION);
    state.match.turnCountdown = Date.now() + config.TURN_DURATION;

    announcer(`Player ${state.match.currentPlayerTurn + 1}'s turn`);
    $('announcer').innerHTML = `Player ${state.match.currentPlayerTurn + 1}'s turn`;
    $('total').innerHTML = `${config.MAX_MATCH_DURATION - state.match.gameTimer + 1} turns left`;
    show($('announcer'));
    currentPlayer.changeWeapon(0);
    setTimeout(() => hide($('announcer')), 3000);

    if (mpEnabled ? state.players[state.match.currentPlayerTurn].id === state.id : state.match.currentPlayerTurn === 0) {
        // Our turn, add hud listeners
        window.onkeyup = (e) => {
            input[e.keyCode] = 0;
            if (e.keyCode === 32 && currentPlayer.ammo[currentPlayer.currentWeapon] > 0) playerShoot();
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
    const winner = state.players.reduce((best, p) => p.hp > best.hp ? p : best);
    announcer(`Player ${winner.name} has won!`);
    $('announcer').innerHTML = `Player ${winner.name} has won!`;
    show($('announcer'));
    state.match.scoreScreen = true;
    moveCamera([winner.x - 540, winner.y -300, 1080, 600], 20);
    winner.changeState(Player.STATES.VICTORY);
    state.match.currentPlayerTurn = winner.index;
    winnerSpectacle = setInterval(() => {
        Projectile.particleSystem(winner.x + rand(-50, 50), winner.y + rand(-50, 50), [rand(128,255), rand(128,255), rand(128,255)], 50, 500);
        winner.face *= -1;
    },1500);
    state.windStrength = 0;
}

const parralax = randomPoints(64, Math.round(a.height * BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 2, -10, 1);