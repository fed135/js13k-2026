import * as title from "./title.js";
import * as match from "./match.js";
import * as lobby from "./lobby.js";
import { announcer, stopBGM } from "./audio.js";
import {loadAtlas} from "./loader.js";

window.state = {t:0, gravity: 1};
(async () => {
    window.assets = await loadAtlas('./sprite.gif', {
        unicorn: { x: 0, y: 0, w: 128, h: 64 },
        rocket: {x:0, y: 64, w: 32, h: 32 },
        star: {x:32, y: 64, w:32, h:32},
        grenade: {x:64, y: 64, w:32, h: 32},
        bullet: {x:96, y: 64, w:32, h: 32},
    });
})();

setInterval(() => {
    state.t++;
    if (state.t > 0xffffff) state.t = 0;
    window.currentScene?.loop();
}, 16);

[title, lobby, match].forEach((s, i) => {
    s.nav.forEach((n, u) => {
        n[0].addEventListener('click', (e) => {
            navigate(n[1]);
        });
    });
});

function navigate(toScene) {
    window.currentScene?.unload();

    state.t = 0;
    //announcer("Say the line Bart!");

    // Reset input handlers

    // Update hud
    if (window.currentScene) {
        window.currentScene.hud.style.display = "none";
        window.currentScene.hud.style.opacity = 0;
    }
    toScene.hud.style.display = "block";
    toScene.hud.style.opacity = 1;

    toScene.load();

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
