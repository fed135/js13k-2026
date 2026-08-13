import * as title from "./title.js";
import * as match from "./match.js";
import * as lobby from "./lobby.js";
import { announcer, stopBGM } from "./audio.js";
import {loadAtlas} from "./loader.js";

window.currentScene = title;

const state = {t:0};
(async () => {
    state.assets = await loadAtlas('./sprite.gif', {
        unicorn: { x: 0, y: 0, w: 128, h: 64 },
    });
})();

setInterval(() => {
    state.t++;
    if (state.t > 0xffffff) state.t = 0;
    currentScene.loop(state);
}, 16);

[title, lobby, match].forEach((s, i) => {
    s.nav.forEach((n, u) => {
        n[0].addEventListener('click', () => {
            state.t = 0;
            announcer("Say the line Bart!");

            // Reset input handlers

            // Update hud
            s.hud.style.display = "none";
            s.hud.style.opacity = 0;
            n[1].hud.style.display = "block";
            n[1].hud.style.opacity = 1;

            // Play track
            stopBGM();
            n[1].bgm();

            //Change currentScene
            window.currentScene = n[1];
        });
    });
});

if (window.Wavedash !== undefined) Wavedash.init();
