import * as title from "./title.js";
import * as match from "./match.js";
import * as lobby from "./lobby.js";
import { announcer, stopBGM } from "./audio.js";
import {loadAtlas} from "./loader.js";

const state = {t:0};
(async () => {
    state.assets = await loadAtlas('./sprite.gif', {
        unicorn: { x: 0, y: 0, w: 128, h: 64 },
    });
})();

setInterval(() => {
    state.t++;
    if (state.t > 0xffffff) state.t = 0;
    window.currentScene?.loop(state);
}, 16);

[title, lobby, match].forEach((s, i) => {
    s.nav.forEach((n, u) => {
        n[0].addEventListener('click', (e) => {
            navigate(n[1]);
        });
    });
});

function navigate(toScene) {
    window.currentScene?.unload(state);

    state.t = 0;
    announcer("Say the line Bart!");

    // Reset input handlers

    // Update hud
    if (window.currentScene) {
        window.currentScene.hud.style.display = "none";
        window.currentScene.hud.style.opacity = 0;
    }
    toScene.hud.style.display = "block";
    toScene.hud.style.opacity = 1;

    toScene.load(state);

    // Play track
    stopBGM();
    toScene.bgm();

    //Change currentScene
    window.currentScene = toScene;
}

navigate(title);

if (window.Wavedash !== undefined) {
    Wavedash.init();
}
