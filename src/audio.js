import { rand } from "./utils.js";
import config from "./config.js";

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
    audioEnabled ? window.currentScene.bgm() : stopBGM();
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

export function playTrack([bpm, beats, value, trackLength, hh, snare, kick, bass, synth]) {
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

export function stopBGM() {
    clearInterval(currentTrack);
    currentTrack = null;
}

export function announcer(line, speed, tone) {
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

export function sfx(type, range, length) {
    const note = rand(range[0], range[1]);
    
    if (type === config.S.airtime) _airTime(note, length);
    if (type === config.S.detonation) _detonation(note, length);
    if (type === config.S.shot) _shot(note, length);
}

export function setVolume(val) {
    track.gain.exponentialRampToValueAtTime(val, A.currentTime + 1);
}