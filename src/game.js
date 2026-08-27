/** Main */

const state = {t:0, gravity: 1, lobby: null, id: null, username: null, terrain: null, players: [], windDirection: 0, windStrength: 0, match: {
            gameTimer: 0,
            currentPlayerTurn: -1,
            turnTimer: null,
            turnCountdown: 0,
            shotMade: false,
            scoreScreen: false,
            currentMissile: null,
        } };

const N = {
        C: 32.70,
        D: 36.71,
        E: 41.20,
        F: 43.65,
        G: 48.99,
        A: 55.00,
        B: 61.74,
};

const config = {
    TERRAIN_ROUGHNESS: 200,
    BASE_COLORS_MIN: 48,
    BASE_COLOR_MAX: 128,
    SPRITE_SIZE: 32,
    SCALE_RATIO: 3,
    GAME_WIDTH: 1080,
    GAME_HEIGHT: 600,
    MAX_MATCH_DURATION: 40,
    TURN_DURATION: 15000,
    FUEL_PER_TURN: 120,
    MATCH_FOREGROUND_OFFSET: 0.65,
    LOBBY_FOREGROUND_OFFSET: 0.8,
    BACKGROUND_HEIGHT: 0.3,

    TRACKS: {
        LOBBY: [120, 4, 4, 64,
            [1],
            [,,,,,,,1,,,,,,,1,1],
            [,1,,,,,1,,1,,,,,1,,],
            [
                N.A,,,N.A,,,[N.A,1],,,[N.A,1],,,N.A,N.G,N.A,N.G,N.G,,N.G,,,N.G,,,N.G,,,N.G,N.A,N.G,N.G,
                N.A,,,N.A,,,[N.A,1],,,[N.A,1],,,N.F,N.G,N.F,N.G,N.F,,N.G,,,N.G,,,N.G,,,N.F,N.A,N.F,N.A
            ],
            [
            [N.E * 4, 1], 0, 0, 0,
            [N.A * 4, .4], 0, [N.G * 4, .4], 0,
            [N.E * 4, .4], 0, [N.D * 4, .4], 0,
            [N.C * 4, 1], 0, 0, 0,
            [N.D * 4, .4], 0, 0, 0,
            [N.F * 4, .4], 0, [N.E * 4, .4], 0,
            [N.D * 4, .4], 0, [N.C * 4, .4], 0,
            [N.D * 4, 1], 0, 0, 0,
        ]],
        MATCH_START: [60, 4, 2, 32, [], [], [1,,,,,,,,,,,,,,,], [N.A,,,N.A,,,N.A,,,N.A,,,N.A,N.G,N.A,N.G,N.G,,N.G,,,N.G,,,N.G,,,N.G,N.A,N.G,N.G], [N.A,10]],
        PLAYER_TURN: [60, 4, 2, 32, [], [], [1,,,,,,,,,,,,,,,], [N.A,,,N.A,,,N.A,,,N.A,,,N.A,N.G,N.A,N.G,N.G,,N.G,,,N.G,,,N.G,,,N.G,N.A,N.G,N.G], []],
        BULLET_WATCH: [60, 4, 2, 32, [], [], [1,,,,,,,,,,,,,,,], [N.A,,,N.A,,,N.A,,,N.A,,,N.A,N.G,N.A,N.G,N.G,,N.G,,,N.G,,,N.G,,,N.G,N.A,N.G,N.G], [N.B,12]],
        MATCH_END: [60, 4, 2, 32, [], [], [1,,,,,,,,,,,,,,,], [N.A,,,N.A,,,N.A,,,N.A,,,N.A,N.G,N.A,N.G,N.G,,N.G,,,N.G,,,N.G,,,N.G,N.A,N.G,N.G], []],
    },
    N,
    S: {
        airtime: 0,
        detonation: 1,
        shot: 2,
    }
};

//[Rocket, Grenade, Bullet, Rainbow]
const icons = ['&#x1F680;','&#x1F348;', '&#x26A1;', '&#x1F308;'];

const NETWORK_ACTIONS = {
    COLOR_CHANGE: 0,
    START_MATCH: 1,
    INIT: 2,
    END_TURN: 3,
    SHOT: 4,
    WIND_CHANGE: 5,
    MOVE: 6,
    INIT2: 7,
    INIT3: 8,
    REFRESH_LOBBY: 9
};

let assets;
let currentScene;

(async () => {
    assets = await loadAtlas('./sprite.gif', {
        unicorn: { x: 0, y: 0, w: 128, h: 128 },
        rocket: {x:0, y: 64, w: 32, h: 32 },
        star: {x:32, y: 64, w:32, h:32},
        grenade: {x:64, y: 64, w:32, h: 32},
        bullet: {x:96, y: 64, w:32, h: 32},
    });
})();

setInterval(() => {
    state.t++;
    if (state.t > 0xffffff) state.t = 0;
    currentScene?.loop();
}, 16);

function navigateScene(toScene) {
    currentScene?.unload();

    state.t = 0;

    // Reset input handlers

    // Update hud
    if (currentScene) {
        currentScene.hud.style.display = "none";
        currentScene.hud.style.opacity = 0;
    }
    toScene.hud.style.display = "block";
    toScene.hud.style.opacity = 1;

    toScene.load();

    // Play track
    stopBGM();
    toScene.bgm();

    //Change currentScene
    currentScene = toScene;
}

/** Audio */

let currentTrack;
const synth = window.speechSynthesis;
let preferredVoice;
let audioEnabled = true;

function setPreferredVoice() {
    preferredVoice = synth.getVoices().find((v) => v.name === "Google UK English Male");
}

const audioToggle = document.getElementById('toggle-audio')

audioToggle.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioToggle.innerHTML = audioEnabled ? '🔇' : '🔊';
    audioEnabled ? currentScene.bgm() : stopBGM();
});

if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = setPreferredVoice;
else setPreferredVoice();

const A = new (window.AudioContext || window.webkitAudioContext)();
const track = A.createGain();
track.connect(A.destination);
const speech = A.createMediaStreamDestination();

const noiseBuffer = () => {
    const b = A.createBuffer(1, 8000, A.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++)
        d[i] = Math.random() * 2 - 1;
    return b;
};

// Randomize noises to make it more organic
const noises = [noiseBuffer(), noiseBuffer(), noiseBuffer(), noiseBuffer()];
const randomNoise = () => noises[Math.floor(Math.random() * noises.length)];


const out = x => x.connect(track);
const sfxOut = x => x.connect(A.destination); 

const noise = () => {
    const n = A.createBufferSource();
    n.buffer = randomNoise();
    return n;
};

const filter = (t, f, q) => {
    const x = A.createBiquadFilter();
    x.type = t;
    x.frequency.value = f;
    if (q) x.Q.value = q;
    return x;
};

function gain(v, d) {
    const T = A.currentTime;
    const g = A.createGain();
    g.gain.setValueAtTime(v, T);
    g.gain.exponentialRampToValueAtTime(.001, T + d);
    return [T, g];
}

function _snare() {
    const T=A.currentTime;
    const n=noise();

    const f=filter('bandpass',1800,.8);
    const g=A.createGain();

    g.gain.setValueAtTime(.8,T);
    g.gain.exponentialRampToValueAtTime(.001,T+.12);

    out(n.connect(f).connect(g));

    n.start(T);
    n.stop(T+.13);
}

function _hh() {
    const [T, g] = gain(0.5, .05);

    const n = noise();

    out(n.connect(filter('highpass', 8000)).connect(g));

    n.start(T);
    n.stop(T + .05);
}

function _kick() {
    const T = A.currentTime;

    const o = A.createOscillator();
    const g = A.createGain();

    o.type = 'sine';
    o.frequency.setValueAtTime(140, T);
    o.frequency.exponentialRampToValueAtTime(45, T + .12);

    g.gain.setValueAtTime(0.7, T);
    g.gain.exponentialRampToValueAtTime(.001, T + .18);

    out(o.connect(g));

    o.start(T);
    o.stop(T + .2);
}

function _bass([note, length]) {
    const [T, g] = gain(1, length);

    const o = A.createOscillator();
    o.frequency.value = note;

    out(o.connect(g));

    o.start(T);
    o.stop(T + length);
}

function _synth([note, length]) {
    const [T, g] = gain(.1, length);
 
    const o = A.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = note * 4;
 
    out(o.connect(g));
 
    o.start(T);
    o.stop(T + length);
}

function playTrack([bpm, beats, value, trackLength, hh, snare, kick, bass, synth]) {
    if (!audioEnabled) return;
    let i = 0;
    const tempo = ((60 / bpm) / beats) * 1000;

    currentTrack = setInterval(() => {
        if (i >= trackLength) i = 0;

        if (hh[i % hh.length]) _hh();
        if (snare[i % snare.length]) _snare();
        if (kick[i % kick.length]) _kick();
        const bassIndex = i % bass.length;
        if (bass[bassIndex]) _bass(Array.isArray(bass[bassIndex]) ? bass[bassIndex] : [bass[bassIndex],tempo/1000]);
        const synthIndex = i % synth.length;
        if (synth[synthIndex]) _synth(Array.isArray(synth[synthIndex]) ? synth[synthIndex] : [synth[synthIndex],tempo/1000]);

        i++;
    }, tempo);
}

function stopBGM() {
    clearInterval(currentTrack);
    currentTrack = null;
}

function announcer(line, speed, tone) {
    if (!audioEnabled) return;
    const utterThis = new SpeechSynthesisUtterance(line);
    if (preferredVoice) utterThis.voice = preferredVoice;
    utterThis.pitch = tone ?? 0.8;
    utterThis.rate = speed ?? 1.2;
    synth.speak(utterThis);
}

// SFX::

function _airTime(note, length) {
    const T = A.currentTime;
    const o = A.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(note ?? 80, T);
    o.frequency.exponentialRampToValueAtTime((note ?? 80) * .3, T + length);
 
    const og = A.createGain();
    og.gain.setValueAtTime(.9, T);
    og.gain.exponentialRampToValueAtTime(.001, T + length);
 
    sfxOut(o.connect(og));
 
    o.start(T);
    o.stop(T + length);
}

function _shot(note, length) {
    const T = A.currentTime;

    const n = noise();
    const f = filter('lowpass', note, 8);
    f.frequency.setValueAtTime(note, T);
    f.frequency.exponentialRampToValueAtTime(note / 10, T + length);
 
    const g = A.createGain();
    g.gain.setValueAtTime(1.5, T);
    g.gain.exponentialRampToValueAtTime(.001, T + length);
 
    sfxOut(n.connect(f).connect(g));
 
    n.start(T);
    n.stop(T + length);
}

function _detonation(note, length) {
    const T = A.currentTime;

    const o = A.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(note ?? 80, T);
    o.frequency.exponentialRampToValueAtTime((note ?? 80) * .1, T + length * .5);

    const og = A.createGain();
    og.gain.setValueAtTime(1, T);
    og.gain.exponentialRampToValueAtTime(.001, T + length * .5);

    sfxOut(o.connect(og));
    o.start(T);
    o.stop(T + length * .5);

    const n = noise();
    const f = filter('lowpass', note * 15, 3);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const t = T + (length * i / steps);
        const p = 1 - (i / steps);
        f.frequency.setValueAtTime(note * 15 * p * p + note, t);
    }

    const ng = A.createGain();
    ng.gain.setValueAtTime(1.2, T);
    ng.gain.exponentialRampToValueAtTime(.001, T + length);

    sfxOut(n.connect(f).connect(ng));
    n.start(T);
    n.stop(T + length);
}

function sfx(type, range, length) {
    if (!audioEnabled) return;
    const note = rand(range[0], range[1]);
    
    if (type === config.S.airtime) _airTime(note, length);
    if (type === config.S.detonation) _detonation(note, length);
    if (type === config.S.shot) _shot(note, length);
}

function setVolume(val) {
    track.gain.exponentialRampToValueAtTime(val, A.currentTime + 1);
}

/** Projectile */

const particles = [];

class Projectile {
    static STATES= {
        ready: 0,
        airtime: 1,
        fallout: 3,
        aim: 4,
        done: 5
    }

    static BEHAVIORS = {
        DEMO: 0,
        PLAYER: 1,
        PARTICLE: 2,
    }

    constructor(head, tailColor, tailLength, damage, falloff, weight, behavior) {
        if(head) {
            this.sprite = osc(config.SPRITE_SIZE, config.SPRITE_SIZE);
            this.sprite[1].drawImage(head, 0, 0);
        }

        this.x = 0;
        this.y = 0;
        this.angle = 45;
        this.speed = 0;
        //this.momentum = 0;
        this.tail = [];
        this.tailColor = tailColor;
        this.tailLength = tailLength;
        this.damage = damage;
        this.falloff = falloff;
        this.weight = weight;
        this.vx = 0;
        this.vy = 0;
        this.lifetime = 0;

        this.behavior = behavior;
        this.state = Projectile.STATES.ready;
    }

    aim(angle, speed) {
        // Print dotted trajectory
    }

    fire(x, y, angle, speed) {
        this.x = x;
        this.y = y - sc;

        this.state = Projectile.STATES.airtime;
        //this.momentum = this.weight * speed;
        this.angle = (angle < 0 ? angle + 180 : angle) * Math.PI / 180;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = -Math.sin(this.angle) * speed;
        this.tail = [];

        if (this.behavior === Projectile.BEHAVIORS.PLAYER) {
            setVolume(0.1);
            sfx(config.S.shot, [1200, 1250], 0.1);
        
            const airtime = this._flightTime(angle, speed);
            sfx(config.S.airtime, [1200, 1250], airtime/100);
        }
    }

    detonate(offset) {
        this.state = Projectile.STATES.fallout;

        if (this.behavior === Projectile.BEHAVIORS.PLAYER) {
            Projectile.particleSystem(this.x, this.y + sc, [32,0,0], 50, 500);

            state.terrain.crater(this.x + sc, this.falloff, offset);
            sfx(config.S.detonation, [60,100], 2);
            setTimeout(() => setVolume(1), 4);
        


            // Apply damage
            state.players.forEach((p) => {
                if (p.hp > 0) {
                    const dist = distance(this.x + sc, this.y + sc, p.x + sc, p.y + sc);
                    if (dist < this.falloff) {
                        const dmg = Math.ceil((1- (dist / this.falloff)) * this.damage);
                        p.hp = Math.max(0, p.hp - dmg);
                        if (p.hp === 0) {
                            //expode!
                            Projectile.particleSystem(p.x, p.y + sc, [255,0,0], 100, 1000);
                        }
                    }
                }
            });
        }
        
    }

    tick() {
        this.lifetime = ++this.lifetime % 0xffffffff;

        if (this.behavior === Projectile.BEHAVIORS.DEMO && this.state === Projectile.STATES.ready) {
            this.state = Projectile.STATES.aim;
            setTimeout(() => this.fire(0, 350, rand(30, 50), rand(21, 32)), rand(1000,5000));
        }

        if (this.state === Projectile.STATES.airtime) {
            this.tail.push([this.x, this.y]);
            if (this.tail.length > this.tailLength) this.tail.shift();

            updateBallistic(this, state.windDirection, state.windStrength, state.gravity);

            if (this.behavior === Projectile.BEHAVIORS.DEMO && this.y > 600) return this.detonate();

            // Detect out of area
            if (this.x + sc < 0 || this.x + sc > state.terrain.width) {
                this.state = Projectile.STATES.fallout;
                return;
            }

            const terrainY = state.terrain.getCurrentY(this.x + sc);
            if (this.y + sc > terrainY) return this.detonate();

            for (let i = 0; i < state.players.length; i++) {
                if (state.players[i] !== this.owner && state.players[i].hp > 0 && this.behavior !== Projectile.BEHAVIORS.DEMO) {
                    const p = state.players[i];
                    if (this.x + sc > p.x + config.SPRITE_SIZE && this.y + sc > p.y + config.SPRITE_SIZE && this.x + sc < p.x + sc * 2 && this.y + sc < p.y + sc * 2) {
                        return this.detonate(true);
                    }
                }
            }
        }

        if (this.state === Projectile.STATES.fallout) {
            this.tail.shift();
            if (this.tail.length === 0) {
                this.state = this.behavior === Projectile.BEHAVIORS.DEMO ? Projectile.STATES.ready : Projectile.STATES.done;
            }
        }

        if (this.behavior === Projectile.BEHAVIORS.PARTICLE && this.lifetime > 1000) {
            particles.shift();
        }
    }

    render() {
        const size = config.SPRITE_SIZE * config.SCALE_RATIO;
        const cx = this.x + size / 2;
        const cy = this.y + size / 2;

        // tail
        c.moveTo(cx, cy);
        for (let t = 0; t < this.tail.length; t++) {
            c.beginPath();
            c.strokeStyle = `rgba(${this.tailColor.join()}, ${0.9 / (this.tailLength - t)})`;
            c.lineTo(this.tail[t][0] + size / 2, this.tail[t][1] + size / 2);
            c.stroke();
        }

        if (this.behavior === Projectile.BEHAVIORS.PARTICLE) return;

        switch(this.state) {
            case Projectile.STATES.airtime:
                if (this.sprite) {
                    // head
                    c.save();
                    c.translate(cx, cy);
                    c.rotate(this.angle * Math.PI / 180);
                    c.drawImage(this.sprite[0], -size / 2, -size / 2, size, size);
                    c.restore();
                }
                break;
            case Projectile.STATES.fallout: 
                c.beginPath();
                c.arc(cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff, 0, 2 * Math.PI);
                const explosionRadial = c.createRadialGradient(cx, cy, 1, cx, cy, this.behavior === Projectile.BEHAVIORS.DEMO ? this.falloff * 4 : this.falloff);
                explosionRadial.addColorStop(0.1, `rgba(${this.tailColor.join()}, 0.9)`);
                explosionRadial.addColorStop(1, `rgba(${this.tailColor.join()}, 0.01)`);
                c.fillStyle = explosionRadial;

                c.save();
                c.globalAlpha =  (this.tail.length / this.tailLength);
                c.fill();
                c.restore();
                
                break;
        }
    }

    _flightTime(angle, speed) {
        const maxSteps = 10000;
        let steps = 0;
        let test = {x: this.x, y: this.y, weight: this.weight};
        test.angle = angle * Math.PI / 180;
        test.vx = Math.cos(test.angle) * speed;
        test.vy = -Math.sin(test.angle) * speed;

        for (;steps < maxSteps; steps++) {
            updateBallistic(test, state.windDirection, state.windStrength, state.gravity);

            const terrainY = state.terrain.getCurrentY(this.x + sc);
            if (test.y > terrainY) {
                return steps;
            }
        }
        return maxSteps;
    }

    static particleSystem(x, y, color, num, speed) {
        for (let i = 0; i < num; i++) {
            setTimeout(() => {
                const p = new Projectile(null, color, 100, 0, 0, 20, Projectile.BEHAVIORS.PARTICLE);
                p.fire(x, y, rand(0, 180), rand(10, 20));
                particles.push(p);
            }, (speed/num) * i);
        }
    }

    static renderParticles() {
        c.lineWidth = 4;
        particles.forEach((p) => {
            p.tick();
            p.render();
        });
    }
}

/** Bolt */

const sc = (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;

class Bullet extends Projectile {
    constructor(behavior) {
        super(assets.bullet, [0,255,0], 100, 100, 100, 10, behavior);
    }

    detonate() {
        setTimeout(() => {
            Projectile.particleSystem(this.x - 60, this.y + sc, [128,128,255], 20, 50);
            state.terrain.crater(this.x + sc - 60, this.falloff, false);
            sfx(config.S.detonation, [60,100], 2);
        }, 400);
        Projectile.particleSystem(this.x, this.y + sc, [128,128,255], 20, 50);

        setTimeout(() => {
            Projectile.particleSystem(this.x + 60, this.y + sc, [128,128,255], 20, 50);
            state.terrain.crater(this.x + sc + 60, this.falloff, false);
            sfx(config.S.detonation, [60,100], 2);
        }, 800);

        super.detonate();
    }
}

/** Grenade */

class Grenade extends Projectile {
    constructor(behavior) {
        super(assets.grenade, [0,255,0], 80, 20, 320, 600, behavior);

        this.bounce = null;
    }

    fire(x, y, angle, speed) {
        if (this.bounce === null) this.bounce = [angle * 0.9, speed * 0.5];
        super.fire(x, y, angle, speed);
    }

    detonate(offset) {
        if (this.bounce?.length) {
            this.fire(this.x, this.y, ...this.bounce);
            this.bounce = false;
            return;
        }
        super.detonate();
    }
}

/** Rainbow */

const rainbowColors = [[255,255,85], [85,255,255], [255,85,255]];

function rainbowLerp(t, direction) {
    let r, g, b;
    if (t < 0.5) {
    // Phase 1: Scale progress from [0, 0.5] to [0, 1]
    const localT = t * 2;
    r = lerp(rainbowColors[0][0], rainbowColors[1][0], localT);
    g = lerp(rainbowColors[0][1], rainbowColors[1][1], localT);
    b = lerp(rainbowColors[0][2], rainbowColors[1][2], localT);
  } else {
    // Phase 2: Scale progress from [0.5, 1] to [0, 1]
    const localT = (t - 0.5) * 2;
    r = lerp(rainbowColors[1][0], rainbowColors[2][0], localT);
    g = lerp(rainbowColors[1][1], rainbowColors[2][1], localT);
    b = lerp(rainbowColors[1][2], rainbowColors[2][2], localT);
  }

  return [r,g,b];
}

class Rainbow extends Projectile {
    constructor(behavior) {
        super(assets.star, [255,255,255], 100, 150, 150, 40, behavior);

        this.tOffset = Math.random();
        this.direction = 1;
    }

    tick() {
        this.tOffset += 0.005 * this.direction;
        if (this.tOffset >= 1 || this.tOffset <= 0) {
            this.direction *= -1;
        }
        this.tailColor = rainbowLerp(this.tOffset, this.direction);

        super.tick();
    }

    render() {
        c.lineWidth = 32;
        super.render();
    }
}

/** Rocket */

class Rocket extends Projectile {
    constructor(behavior) {
        super(assets.rocket, [255,0,0], 100, 20, 200, 20, behavior);
    }
}

/** Utils */

function applyRecolor(imageData, from, to) {
  const data = imageData.data;
  const [fr, fg, fb] = from;
  const [tr, tg, tb] = to;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue; // skip fully transparent pixels

    if (
      Math.abs(r - fr) <= 0 &&
      Math.abs(g - fg) <= 0 &&
      Math.abs(b - fb) <= 0
    ) {
      data[i] = tr;
      data[i + 1] = tg;
      data[i + 2] = tb;
    }
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function randomBase() {
  return [rand(config.BASE_COLORS_MIN, config.BASE_COLOR_MAX), rand(0,config.BASE_COLORS_MIN), rand(config.BASE_COLORS_MIN, config.BASE_COLOR_MAX)];
}

function randomPoints(amount, startingValue, variation, roughness, min, max) {
    const points = [startingValue];
    for(let i = 0; i < amount; i++ ) {
        if (Math.random() < variation) {
            points.push(Math.round(Math.min((max ?? Infinity) * roughness, Math.max((min ?? -Infinity) * roughness, Math.round((points[points.length -1] + ((Math.random() * 0.1) - 0.05) * roughness))))));
        }
        else points.push(points[points.length -1]);
    }
    return points;
}

function $(id) {
  return document.getElementById(id);
}

function hide(element) {
  element.style.display = 'none';
}

function show(element) {
  element.style.display = 'block';
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function updateBallistic(target, windDirection, windStrength, gravity) {
  const dt = 1/6;
  const windRad = windDirection * Math.PI / 180;
  const windAccelX = (Math.cos(windRad) * windStrength) / target.weight;
  const windAccelY = (Math.sin(windRad) * windStrength) / target.weight;
  
  target.vx += windAccelX * dt;
  target.vy += (gravity + windAccelY) * dt;
  
  target.x += target.vx * dt;
  target.y += target.vy * dt;
  
  target.angle = Math.atan2(target.vx, -target.vy) * 180 / Math.PI;
  //target.distanceTraveled = Math.hypot(this.x - this.originalX, this.y - this.originalY); // Could be interesting to calculate bonus damage based on airtime
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** Canvas */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const [a, c] = osc(config.GAME_WIDTH, config.GAME_HEIGHT);

let cameraMovement = { from: null, to: null, current: [0, 0, config.GAME_WIDTH, config.GAME_HEIGHT], ot: 0, speed: 0 };

function cleanCanvas(cameraOnly) {
    if (!cameraOnly) {
        canvas.width = config.GAME_WIDTH;
        canvas.height = config.GAME_HEIGHT;
    }
    a.width = state?.terrain?.width ?? config.GAME_WIDTH;
    a.height = config.GAME_HEIGHT;

    ctx.imageSmoothingEnabled = false;

    c.imageSmoothingEnabled = false;
    c.lineCap = 'square';
}

function osc(w, h) {
    const _a = new OffscreenCanvas(w,h);
    const _c = _a.getContext('2d');
    _c.imageSmoothingEnabled = false;

    return [_a, _c];
}

function moveCamera(coords, speed) {
    if (!cameraMovement.to) {
      cameraMovement.from = cameraMovement.current;
      cameraMovement.to = coords;
      cameraMovement.ot = 0;
      cameraMovement.speed = speed;
    }
}

function resetCamera(speed) {
   moveCamera([0, 0, config.GAME_WIDTH, config.GAME_HEIGHT], speed ?? 1);
}

function printFrame() {
    if (cameraMovement.to) {
        cameraMovement.current[0] = lerp(cameraMovement.from[0], cameraMovement.to[0], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[1] = lerp(cameraMovement.from[1], cameraMovement.to[1], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[2] = lerp(cameraMovement.from[2], cameraMovement.to[2], cameraMovement.ot / cameraMovement.speed);
        cameraMovement.current[3] = lerp(cameraMovement.from[3], cameraMovement.to[3], cameraMovement.ot / cameraMovement.speed);

        // Bound!
        cameraMovement.current[0] = Math.min(a.width - cameraMovement.current[2], Math.max(0, cameraMovement.current[0]));
        cameraMovement.current[1] = Math.min(a.height, Math.max(0, cameraMovement.current[1]));

        cameraMovement.ot++;
        if (cameraMovement.ot === cameraMovement.speed) delete cameraMovement.to;
    }

    ctx.drawImage(a, ...cameraMovement.current, 0, 0, config.GAME_WIDTH, config.GAME_HEIGHT);
}

let perlinCache;

function perlin() {
  if (perlinCache) return perlinCache;
  let ctx;
  [perlinCache, ctx] = osc(128, 128);
  const I = ctx.getImageData(0, 0, 128, 128);
  const D = I.data;

  const P = new Uint8Array(256);
  for (let i = 0; i < 256; i++) P[i] = Math.random() * 256;

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const grad = (h, x, y) => (h & 3) == 0 ? x : (h & 3) == 1 ? -x : (h & 3) == 2 ? y : -y;

  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = P[P[X] + Y], ab = P[P[X] + Y + 1];
    const ba = P[P[X + 1] + Y], bb = P[P[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
      lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
      v
    );
  };

  const CELL = 4;
  const LEVELS = 4;
  const SCALE = 8;

  const BAYER = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
  ].map(v => (v + 0.5) / 16);

  let p = 0;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const cx = Math.floor(x / CELL) * CELL;
      const cy = Math.floor(y / CELL) * CELL;
      const n = (noise(cx / SCALE, cy / SCALE) + 1) / 2;

      const threshold = BAYER[(y % 4) * 4 + (x % 4)];
      const banded = Math.floor((n * (LEVELS - 1) + threshold)) / (LEVELS - 1);
      const val = Math.max(0, Math.min(255, Math.round(banded * 255)));

      D[p++] = val; D[p++] = val; D[p++] = val; D[p++] = 255;
    }
  }

  ctx.putImageData(I, 0, 0);
  return perlinCache;
}

cleanCanvas();
window.onresize = cleanCanvas;

function _loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function _loadSprite(img, def) {
  const [canvas, ctx] = osc(def.w, def.h);
 
  ctx.drawImage(img, def.x, def.y, def.w, def.h, 0, 0, def.w, def.h);

  return canvas;
}

async function loadAtlas(image, manifest) {
  const img = await _loadImage(image);
  return Object.keys(manifest).reduce((acc, curr) => {
    acc[curr] = _loadSprite(img, manifest[curr]);
    return acc;
  }, {});
}

/** Player */

class Player {

    x = 0;
    y = 0;
    face = 1;
    animationOffset = Math.floor(Math.random() *4);
    frameOffset = [0,0]
    speed = 0;
    angle = 45;
    ammo = [Infinity, 3, 3, 1];
    weapons = [Rocket, Grenade, Bullet, Rainbow];
    currentWeapon = 0;
    playing = false;

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
        DYING: 7,
    }

    static ANIMATION_SPEED = {
        FAST: 20,
        SLOW: 80,
        NEVER: 0xFFFFFFFF,
    }

    constructor(baseColor, hatColor, name, behavior) {
        this.sprite = osc(assets.unicorn.width, assets.unicorn.height);
        this.baseColor = baseColor;
        this.hatColor = hatColor;
        this.name = name;
        this.behavior = behavior;
        this.hp = 100;
        this.currentFuel = config.FUEL_PER_TURN;

        this.state = null;
    
        // duplicate canvas
        this.sprite[1].drawImage(assets.unicorn, 0, 0);

        // draw baseColor
        this.recolor([255,0,0], this.baseColor);
        this.recolor([255,255,255], this.hatColor);
    }

    tick() {
        // Check falling
        if (this.behavior !== Player.BEHAVIORS.DEMO) {
            const terrainY = state.terrain.getCurrentY(this.x + sc);
            
            if (this.y < terrainY - (config.SPRITE_SIZE * config.SCALE_RATIO)) {
                if (this.behavior !== Player.BEHAVIORS.LOBBY_CYCLE) {
                    this.y += 7;
                    return;
                }
            }
            this.y = terrainY - (config.SPRITE_SIZE * config.SCALE_RATIO);
        }

        // Logic
        this.checkBehavior();
        
        // Animations
        switch(this.state) {
            case Player.STATES.WALKING:
                this.frameOffset[1] = 1;
                this.animationStep(Player.ANIMATION_SPEED.FAST);
                break; 
            case Player.STATES.IDLE:
                this.frameOffset[1] = 0;
                this.animationStep(Player.ANIMATION_SPEED.SLOW);
                break;
            case Player.STATES.DEAD:
                this.frameOffset[1] = 3;
                this.frameOffset[0] = 0;
                break;
            case Player.STATES.AIMING:
                this.frameOffset[1] = 0;
                this.animationStep(Player.ANIMATION_SPEED.NEVER);
                break;
            case Player.STATES.VICTORY:
                this.frameOffset[1] = 3;
                this.frameOffset[0] = 1;
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

    animationStep(speed) {
        if (state.t % speed === 0) this.frameOffset[0]++;
        if (this.frameOffset[0] > 3) this.frameOffset[0] = 0;
    }

    checkBehavior() {
        switch(this.behavior) {
            case Player.BEHAVIORS.BOT:
                // Check match state, is it our turn ?
                break;
            case Player.BEHAVIORS.DEMO:
                this.changeState(Player.STATES.IDLE);
                
                /*if (state.hatColor.join() !== this.hatColor.join()) {
                    this.recolor(this.hatColor, state.hatColor);
                    this.hatColor = state.hatColor;
                }*/
                break;
            case Player.BEHAVIORS.LOBBY_CYCLE:
                // set to walking, advance on terrain
                this.changeState(Player.STATES.WALKING);
                this.face = -1;

                this.x += rand(1.4, 1.5);
                if (this.x > a.width + (config.SPRITE_SIZE * config.SCALE_RATIO)) this.x = -(config.SPRITE_SIZE * config.SCALE_RATIO)
                break;

            case Player.BEHAVIORS.PLAYER:
                // Check match state, is it our turn ? Are there inputs
                if (this.hp <= 0) this.state = Player.STATES.DEAD;
                break;
        }
    }
    
    move(dir) {
        if (dir === 0) {
            this.changeState(Player.STATES.IDLE);
        }

        if (this.currentFuel > 0) {
            this.x = Math.min(state.terrain.width, Math.max(0, this.x + dir));
            this.currentFuel--;
        }
        const newFace = dir * -1;
        if (newFace !== this.face) this.angle *= -1;
        this.face = newFace;
        this.changeState(Player.STATES.WALKING);
    }

    render() {
        const size = config.SPRITE_SIZE * config.SCALE_RATIO;
        const cx = this.x + size / 2;
        const cy = this.y + size / 2;

        c.strokeStyle = 'black';
        c.lineWidth = 4;
        c.lineJoin = "round";

        c.save();
        c.translate(cx, cy);
        c.scale(this.face, 1);
        c.drawImage(
            this.sprite[0],
            this.frameOffset[0] * config.SPRITE_SIZE,
            this.frameOffset[1] * config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            config.SPRITE_SIZE,
            -size / 2,
            -size / 2,
            config.SPRITE_SIZE * config.SCALE_RATIO,
            config.SPRITE_SIZE * config.SCALE_RATIO
        );
        if (this.playing && this.state !== Player.STATES.VICTORY) {
            c.beginPath();
            c.moveTo(-size / 2, 0);
            c.arc(-size / 2, 0, size, 190 * Math.PI / 180, 260 * Math.PI / 180, false);
            c.closePath();
            c.globalAlpha = 0.4;
            c.fillStyle = 'white';
            c.fill();
            c.strokeStyle = 'grey';
            c.globalAlpha = 1;
            c.lineWidth = 1;
            c.stroke();
            c.lineWidth = 4;
            c.strokeStyle = 'blue';
            c.beginPath();
            c.moveTo(-size / 2, 0);
            c.lineTo(-size / 2 + Math.cos((this.angle < 0 ? this.angle *-1 +180 : this.angle + 180) * Math.PI / 180) * size, Math.sin((this.angle < 0 ? this.angle * -1 +180: this.angle + 180) * Math.PI / 180) * size);
            c.stroke();
        }
        c.restore();

        // hpbar
        if (this.behavior === Player.BEHAVIORS.PLAYER && this.hp > 0) {
            c.strokeRect(this.x, this.y - 8, (config.SPRITE_SIZE * config.SCALE_RATIO), 9);
            c.fillStyle = 'red';
            c.fillRect(this.x, this.y - 8, (this.hp/100) * (config.SPRITE_SIZE * config.SCALE_RATIO), 9);
        }

        // Display name (should probably render once in an osc)
        c.textAlign = 'center';
        c.font = 'normal bolder 18px sans-serif';
        c.fillStyle = this.hp > 0 ? 'white' : '#333';
        
        c.strokeText(this.name, this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y + (this.hp > 0 ? -16 : 16));
        c.fillText(this.name, this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y + (this.hp > 0 ? -16 : 16));

        if (this.playing && this.state !== Player.STATES.VICTORY) {
            c.beginPath();
            c.moveTo(this.x + 24, this.y - 54);
            c.lineTo(this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) - 24, this.y - 54);
            c.lineTo(this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y - 36);
            c.closePath();
            c.fillStyle = 'green';
            c.fill();
            c.fillStyle = 'black';
            c.fillText(Math.round((state.match.turnCountdown - Date.now()) / 1000), this.x + (config.SPRITE_SIZE * config.SCALE_RATIO) /2, this.y -64);
        }
    }

    changeWeapon(dir) {
        this.currentWeapon += dir;
        if (this.currentWeapon < 0) this.currentWeapon = 3;
        if (this.currentWeapon > 3) this.currentWeapon = 0;

        $('weapon-icon').innerHTML = icons[this.currentWeapon];
        $('current-ammo').innerHTML = this.ammo[this.currentWeapon];
    }
}

/** Terrain */

class Terrain {
    constructor(amount, startingValue, variation, roughness, min, max, offset, width) {
        this.coords = randomPoints(amount, startingValue, variation, roughness, min, max).map((p) => [p,p]); // [[originalY, currentY], ...]
        this.offset = offset;
        this.width = width;
    }

    render() {
        // each section with the gradient starting at the right height 
        // c.strokeStyle = "black";
        // c.lineWidth = 6;

        const cw = this.width / this.coords.length;

        this.coords.forEach((coord, i) => {
            c.beginPath();
            c.moveTo(Math.floor(i * cw), coord[1]);
            c.lineTo(Math.ceil(i * cw + cw), coord[1]);
            c.lineTo(Math.ceil(i * cw + cw), a.height);
            c.lineTo(Math.floor(i * cw), a.height);
            c.closePath();

            const soilGradient = c.createLinearGradient(0, coord[0], 0, a.height);
            
            soilGradient.addColorStop(0, "#009900");
            soilGradient.addColorStop(0.05, "#006633");
            soilGradient.addColorStop(0.1, "#ffcc99");
            soilGradient.addColorStop(1, "brown");
            
            c.fillStyle = soilGradient;
            c.fill();
            //c.stroke();
            
            c.globalCompositeOperation = 'multiply';
            c.fillStyle = pattern;
            c.fill();
            c.globalCompositeOperation = 'source-over';
        });
    }

    crater(x, falloff, offset) {
        const clampedX = Math.max(0, Math.min(this.width, x));
        const index = Math.min(this.coords.length - 1, Math.floor((clampedX / this.width) * this.coords.length));
        
        // Apply reduction to surrounding terrain as well
        const newfloor = this.coords[index][1] + (falloff * (offset ? 0.1 : 1/6));
        if (this.coords[index][1] > newfloor) return;

        for(let i = 1; i < falloff / 2; i++) {
            if (index - i > 0) this.coords[index - i][1] = Math.max(newfloor - (falloff * (i/16) * (i/16)), this.coords[index - i][1]);
            if(index + i < this.coords.length) this.coords[index + i][1] = Math.max(newfloor - (falloff * (i/16) * (i/16)), this.coords[index + i][1]);
        }
        this.coords[index][1] = newfloor;
    }

    getCurrentY(x) {
        const clampedX = Math.max(0, Math.min(this.width, x));
        const index = Math.min(this.coords.length - 1, Math.floor((clampedX / this.width) * this.coords.length));

        return this.coords[index][1];
    }
}

/** Scene */

const pattern = c.createPattern(perlin(), 'repeat');

let t = - 2000;

function sky() {
    //sky
    t++;
    if (t>4000) t =-2000;
    const gradient = c.createRadialGradient(t, 90, 30, t, 100, a.width);
    
    gradient.addColorStop(0, "#FAFAD2");
    gradient.addColorStop(0.05, "white");
    gradient.addColorStop(0.25, "#F0FFFF");
    gradient.addColorStop(0.5, "#87CEFA");
    gradient.addColorStop(1, "#191970");
    
    c.fillStyle = gradient;
    c.fillRect(0,0,a.width, a.height);
}

function backdrop(parralax, height) {
    const sy = Math.round(a.height * height);
    c.beginPath();
    c.moveTo(0, sy);
    for (let t = 0; t < parralax.length; t++) {
        const x = Math.round(t * (a.width / parralax.length));
        const y = parralax[t];
        c.lineTo(x, y + sy);
        
    }
    c.lineTo(a.width, parralax[parralax.length -1]);
    c.lineTo(a.width, a.height);
    c.lineTo(0, a.height);
    c.lineTo(0, sy);
    c.closePath();
    const parallaxGradient = c.createLinearGradient(0, 0, 0, a.height);
    parallaxGradient.addColorStop(0, "white");
    parallaxGradient.addColorStop(1, "#191970");
    c.fillStyle = parallaxGradient;
    c.fill();
}

function mound(offsetX, offsetY, height) {
    //c.strokeStyle = "black";
    //c.lineWidth = 6;
    c.beginPath();
    c.moveTo(Math.round(a.width * offsetX) - 600, a.height);
    c.lineTo(Math.round(a.width * offsetX) - 200, Math.round(a.height * offsetY) + 100);
    c.lineTo(Math.round(a.width * offsetX) - 80, Math.round(a.height * offsetY));
    c.lineTo(Math.round(a.width * offsetX) + 80, Math.round(a.height * offsetY));
    c.lineTo(Math.round(a.width * offsetX) + 200, Math.round(a.height * offsetY) + 100);
    c.lineTo(Math.round(a.width * offsetX) + 600, a.height);
    c.closePath();
    const soilGradient = c.createLinearGradient(0, a.height * offsetY, 0, a.height * height);
    
    soilGradient.addColorStop(0, "#009900");
    soilGradient.addColorStop(0.1, "#ffcc99");
    soilGradient.addColorStop(0.9, "#8B4513");
    
    c.fillStyle = soilGradient;
    //c.fillStyle = "#8B4513";
    c.fill();
    //c.stroke();
    
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = pattern;
    c.fill();
    c.globalCompositeOperation = 'source-over';
}

//-----------------------------

const parralax = randomPoints(64, Math.round(a.height * config.BACKGROUND_HEIGHT), 0.6, config.TERRAIN_ROUGHNESS * 2, -10, 1);

/** Match */


let input = {};

let currentPlayer;

const match = {
    loop: () => {
        //clear
        cleanCanvas();

        //sky
        sky(state.t);

        backdrop(parralax, config.BACKGROUND_HEIGHT);

        if(state.match.currentPlayerTurn < 0) return;

        // Foreground
        state.terrain.render();

        if (!state.match.shotMade && state.match.turnCountdown > 0) {
            $('current-angle').innerHTML = Math.round(currentPlayer.angle);
            $('current-speed').style.width = `calc(${(currentPlayer.speed / 50) * 100}% - 8px)`;
            $('current-fuel').style.width = `calc(${(currentPlayer.currentFuel / config.FUEL_PER_TURN) * 100}% - 8px)`;
        
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

                if (mpEnabled && state.t % 10 === 0) window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.MOVE},${currentPlayer.x},${currentPlayer.face}`);
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
        ctx.lineTo(10,14);
        ctx.lineTo(-10,14);
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
        ctx.fillStyle = state.windStrength > 15 ? '#b60' :  '#bbb';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.lineJoin = "round";

        ctx.strokeText('WIND: ' + Math.round(state.windStrength), 540, 20);
        ctx.fillText('WIND: ' + Math.round(state.windStrength), 540, 20);
    },
    nav: [],
    hud: $('match'),
    bgm: () => playTrack(config.TRACKS.MATCH_START),
    load: () => {
        state.terrain = new Terrain(256, Math.round(a.height * config.MATCH_FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -6, 6, Math.round(a.height * config.MATCH_FOREGROUND_OFFSET), a.width * 2);

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

            if (currentPlayer['isHost']) {
                const coords = JSON.stringify(state.terrain.coords.map(c => c[0]));
                window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.INIT},${coords.substring(0,400)}`);
                window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.INIT2},${coords.substring(400,800)}`);
                window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.INIT3},${coords.substring(800)}`);
                setTimeout(() => endTurn(), 1000);
            }
        }
        else {
            // start the game
            endTurn();
        }
    },
    unload: () => {}
};

let terrainChunks = '';

function userAction(a) {
     switch(Number(a.message[0])) {
            case NETWORK_ACTIONS.COLOR_CHANGE: 
                setColor(state.players.findIndex(p => p.name === a.username), a.message.split(',').splice(1,3));
                break;
            case NETWORK_ACTIONS.START_MATCH:
                return navigateScene(match);
            case NETWORK_ACTIONS.INIT:
            case NETWORK_ACTIONS.INIT2: 
                terrainChunks += a.message.substring(2);
                break;
            case NETWORK_ACTIONS.INIT3: 
                terrainChunks += a.message.substring(2);
                state.terrain.coords = JSON.parse(terrainChunks).map(c => [c,c]);
                break;
            case NETWORK_ACTIONS.END_TURN:
                const currentIndex = parseInt(a.message.split(',')[1]);
                endTurn(true, currentIndex); //noloop
                break;
            case NETWORK_ACTIONS.MOVE:
                if (a.username === currentPlayer.name) return;
                const mp = state.players.find((p) => p.name === a.username);
                mp.x = Number(a.message.split(',')[1]);
                mp.face = Number(a.message.split(',')[2]);
                break;
            case NETWORK_ACTIONS.WIND_CHANGE:
                const newWind = a.message.split(',');
                state.windDirection = Number(newWind[1]);
                state.windStrength = Number(newWind[2]);
                break;
            case NETWORK_ACTIONS.SHOT:
                //4,0,384,313,45,0.6000000000000001
                const shot = a.message.split(',');
                const from = state.players.find(p => p.index === parseInt(shot[1]));
                if (currentPlayer['isHost'] && !from.id) return; // host already knows about the shot.
                from.currentWeapon = parseInt(shot[2]);
                from.x = parseInt(shot[3]);
                from.y = parseInt(shot[4]);
                from.angle = parseInt(shot[5]);
                from.speed = parseInt(shot[6]);
                playerShoot(true, from !== currentPlayer); //noloop
                break;
            case NETWORK_ACTIONS.REFRESH_LOBBY:
                refreshPlayers();
        }
}

function playerShoot(noloop, stillProcess) {
    if (mpEnabled && currentPlayer['isHost'] && noloop && !stillProcess) return; // Prevent recursion

    state.match.shotMade = true;
    //if (state.players[state.match.currentPlayerTurn].id )
    // reset hud
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('keydown', keyDown);
    input = {};
    clearTimeout(state.match.turnTimer);

    const cp = state.players[state.match.currentPlayerTurn];
    let missile = new cp.weapons[cp.currentWeapon](Projectile.BEHAVIORS.PLAYER);
    missile.fire(parseInt(cp.x), parseInt(cp.y), parseInt(cp.angle), parseInt(cp.speed));
    state.match.currentMissile = missile;
    missile.owner = cp;
    cp.ammo[cp.currentWeapon]--;

    if (cp === currentPlayer) $('last-shot').style.marginLeft = `calc(${(currentPlayer.speed / 50) * 100}% - 8px)`;
    if (mpEnabled && !noloop) window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.SHOT},${cp.index},${cp.currentWeapon},${cp.x},${cp.y},${cp.angle},${cp.speed}`);
}

function endTurn(noloop, currentIndex) {
    // if host, communicate end of turn to others
    if (mpEnabled && currentPlayer.isHost && noloop) return; // Prevent recursion
    if (mpEnabled && currentPlayer.isHost && !noloop) window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.END_TURN},${state.match.currentPlayerTurn}`);
    if (state.match.scoreScreen) return;

    // reset hud
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('keydown', keyDown);
    input = {};
    currentPlayer.changeState(Player.STATES.IDLE);

    state.match.gameTimer++;
    state.match.shotMade = false;
    state.match.currentPlayerTurn = (currentIndex > -1 ? currentIndex : state.match.currentPlayerTurn + 1) % 4;

    if (state.match.gameTimer > config.MAX_MATCH_DURATION) return endMatch();

    if (state.players[state.match.currentPlayerTurn].hp <= 0) {
        if (state.players.filter((p) => p.hp > 0).length > 1) return endTurn(noloop);
        else return endMatch();
    }

    if (state.match.gameTimer === 1 || (state.match.gameTimer +1) % 6 === 0) {
        sfx(config.S.shot, [300, 400], 5);
        state.windDirection = Math.round(rand(0, 180));
        state.windStrength = Math.round(rand(0, 30));
        if (mpEnabled && currentPlayer['isHost']) window.Wavedash.sendLobbyMessage(state.lobby, `${NETWORK_ACTIONS.WIND_CHANGE},${state.windDirection},${state.windStrength}`);
    }
    state.players[state.match.currentPlayerTurn].speed = 0;
    state.players[state.match.currentPlayerTurn].currentFuel = config.FUEL_PER_TURN;
    if ((mpEnabled && currentPlayer['isHost']) || !mpEnabled)state.match.turnTimer = setTimeout(endTurn, config.TURN_DURATION);
    state.match.turnCountdown = Date.now() + config.TURN_DURATION;

    announcer(`Player ${state.match.currentPlayerTurn + 1}'s turn`);
    $('announcer').innerHTML = `Player ${state.match.currentPlayerTurn + 1}'s turn`;
    $('total').innerHTML = `${config.MAX_MATCH_DURATION - state.match.gameTimer + 1} turns left`;
    show($('announcer'));
    currentPlayer.changeWeapon(0);
    setTimeout(() => hide($('announcer')), 3000);

    if (mpEnabled ? state.players[state.match.currentPlayerTurn].id === state.id : state.match.currentPlayerTurn === 0) {
        // Our turn, add hud listeners
        window.addEventListener('keyup', keyUp);
        window.addEventListener('keydown', keyDown);
    }

    if (!state.players[state.match.currentPlayerTurn].id && ((mpEnabled && currentPlayer['isHost']) || !mpEnabled)) {
        // It's a bot... try to aim...?
        setTimeout(() => {
            state.players[state.match.currentPlayerTurn].angle = rand(20, 60) * state.players[state.match.currentPlayerTurn].face * -1;
            state.players[state.match.currentPlayerTurn].speed = rand(25, 40);

            playerShoot();
        }, rand(2000, 3000));
    }
}

function keyUp(e) {
    input[e.keyCode] = 0;
    if (e.keyCode === 32 && currentPlayer.ammo[currentPlayer.currentWeapon] > 0) playerShoot();
    e.preventDefault();
}

function keyDown(e) {
    input[e.keyCode] = 1;
    e.preventDefault();
}

function endMatch() {
    if (mpEnabled) window.Wavedash.off("LobbyMessage", userAction);
    show($('game-over'));
    const winner = state.players.reduce((best, p) => p.hp > best.hp ? p : best);
    announcer(`Player ${winner.name} has won!`);
    $('announcer').innerHTML = `Player ${winner.name} has won!`;
    show($('announcer'));
    state.match.scoreScreen = true;
    moveCamera([winner.x - 540, winner.y -300, 1080, 600], 20);
    winner.changeState(Player.STATES.VICTORY);
    state.match.currentPlayerTurn = winner.index;
    setInterval(() => {
        Projectile.particleSystem(winner.x + rand(-50, 50), winner.y + rand(-50, 50), [rand(128,255), rand(128,255), rand(128,255)], 50, 500);
        winner.face *= -1;
    },1500);
    state.windStrength = 0;
}

/** Lobby */

const MOUND_HEIGHT = 0.55;
const UNI_COUNT = 32;

const cyclingUnicorns = [];

const mpEnabled = (window.Wavedash);

let uniNames = ['Player', 'BOT Dolly', 'BOT Jolly', 'BOT Denis'];
let currentPlayerIndex = 0;

let demoRockets = [];

let lobbyHost;

const lobby = {
    loop: () => {
        //clear
        cleanCanvas();

        sky();

        // Parallax
        backdrop(parralax, config.BACKGROUND_HEIGHT);

        demoRockets.forEach((d) => {
            d.tick();
            d.render();
        });

        // background
        mound(0.2, MOUND_HEIGHT, config.LOBBY_FOREGROUND_OFFSET );
        mound(0.4, MOUND_HEIGHT, config.LOBBY_FOREGROUND_OFFSET );
        mound(0.6, MOUND_HEIGHT, config.LOBBY_FOREGROUND_OFFSET );
        mound(0.8, MOUND_HEIGHT, config.LOBBY_FOREGROUND_OFFSET );

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
    },
    nav: [],
    hud: $('lobby'),
    bgm: () => playTrack(config.TRACKS.LOBBY),
    load: () => {
        resetCamera();
        state.terrain = new Terrain(128, Math.round(a.height * config.LOBBY_FOREGROUND_OFFSET), 0.5, config.TERRAIN_ROUGHNESS, -3, 3, Math.round(a.height * config.LOBBY_FOREGROUND_OFFSET), a.width);
        hide($('lobby-owner'));

        for (let i = 0; i < 4; i++ ) {
            const player = new Player(randomBase(), [rand(128,255),rand(128,255),rand(128,255)], uniNames[i], Player.BEHAVIORS.DEMO);
            player.x = a.width * (0.2 * (i + 1)) - (config.SPRITE_SIZE * config.SCALE_RATIO) / 2;
            player.y = a.height * MOUND_HEIGHT - (config.SPRITE_SIZE * config.SCALE_RATIO);
            if (!mpEnabled && i === 0) player.id = 1;
            state.players.push(player);
        }

        for (let i = 0; i < UNI_COUNT; i++ ) {
            const uni = new Player([255,255,255], randomBase(), '', Player.BEHAVIORS.LOBBY_CYCLE);
            uni.x = i * Math.round(a.width / UNI_COUNT);
            uni.y = (a.height * config.LOBBY_FOREGROUND_OFFSET) - config.TERRAIN_ROUGHNESS;
            cyclingUnicorns.push(uni);
        }

        for (let i = 0; i < 8; i++ ) {
            demoRockets.push(new Rainbow(Projectile.BEHAVIORS.DEMO));
        }

        if (mpEnabled) {
            $('name').value = state.username;
            $('name').disabled = true;

            window.Wavedash.on("LobbyUsersUpdated", refreshPlayers);
            window.Wavedash.on("LobbyMessage", userAction);

            if (state.lobby) {
                window.Wavedash.joinLobby(state.lobby).then(() => {
                    hide($('start-match'));
                    refreshPlayers();
                }).catch(e => {
                    delete state.lobby;
                    navigateScene(lobby);
                });
            }
            else {
                $('invite').style.display = 'block';

                // 2: Private
                window.Wavedash.createLobby(2, 4).then((l) => {
                    state.lobby = l['data'];
                    lobbyHost = state.players[0];
                    window.Wavedash.setLobbyData(state.lobby, 'ho', JSON.stringify([state.id]));

                    window.Wavedash.getLobbyInviteLink(true).then((res) =>  { $('invite-link').value = res['data'] });

                    refreshPlayers();
                });

               $('copy-link').addEventListener('click', (e) => {
                    navigator.clipboard.writeText($('invite-link').value);
                    e.target.nextElementSibling.style.display='block';
               });
            }
        }
        $('start-match').addEventListener('click', (e) => {
            if (mpEnabled) window.Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.START_MATCH);
            else navigateScene(match);
        });

        window.updateColor = (e) => {
            let c = hexToRgb(e.target.value);
            // Prevent full black
            if (c.join() === '0,0,0') c = [1,0,0];

            setColor(currentPlayerIndex, c);
            // if mp, send it to other players
            if (mpEnabled) window.Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.COLOR_CHANGE+','+c.join(','));
        }

        window.updateName = (e) => {
            // option not available in mp
            state.players[currentPlayerIndex].name = e.target.value;
        }

    },
    unload: () => {
        if (mpEnabled) {
            window.Wavedash.off("LobbyUsersUpdated", refreshPlayers);
        }
    }
};

function setColor(playerIndex, value) {
    if (playerIndex > -1) {
        state.players[playerIndex].recolor(state.players[playerIndex].hatColor, value);
        state.players[playerIndex].hatColor = value;
    }
}

function refreshPlayers(e) {
    const users = window.Wavedash.getLobbyUsers(state.lobby);

    // if host, we'll update the metadata
    if (e && lobbyHost) {
        window.Wavedash.sendLobbyMessage(state.lobby, ''+NETWORK_ACTIONS.REFRESH_LOBBY);
    }

    for (let i = 0; i < 4; i++) {
        const u = users[i];
        if (u?.['isHost']) {
            show($('lobby-owner'));
            state.players[i]['isHost'] = true;
            $('lobby-owner').innerHTML = `${u.username}'s lobby`;
        }
        state.players[i].name = u?.['username'] ?? uniNames[i];
        state.players[i].id = u?.['userId'] ?? null; // If no id, it's a BOT.
        if (u?.['userId'] === window.Wavedash.getUserId()) {
            currentPlayerIndex = i;
            $('picker').style.marginLeft = `${110 + 212 * i}px`;
        }
    }
}

/** Title */

const title = {
    loop: () => {},
    nav: [[$('title'), lobby], [$('join'), lobby]],
    hud: $('title'),
    bgm: () => {},
    load: () => {
        if (window.Wavedash) {
            // Set user info in the game state
            state.username = window.Wavedash.getUsername();
            state.id = window.Wavedash.getUserId();

            // Join MP session if in params
            const params = window.Wavedash.getLaunchParams();
            if (params['lobby']) {
                show($('accept-invite'));
                state.lobby = params['lobby'];
            }
        }

        $('decline').addEventListener('click', (e) => {
            state.lobby = null;
            hide($('accept-invite'));
        });
    },
    unload: () => {
        hide($('accept-invite'));
    }
};

/** Boot */

[title, lobby, match].forEach((s, i) => {
    s.nav.forEach((n, u) => {
        n[0].addEventListener('click', (e) => {
            navigateScene(n[1]);
        });
    });
});

navigateScene(title);

if (window.Wavedash !== undefined) {
    window.Wavedash.init();
}