import * as lobby from "./lobby.js";
import {$,show,hide} from "./utils.js";

export function loop() {

}

export const nav = [[$('title'), lobby], [$('join'), lobby]];

export const hud = $('title');

export const bgm = () => {};
export const load = (state) => {
    if (window.Wavedash) {
        // Set user info in the game state
        state.username = Wavedash.getUsername();

        // Join MP session if in params
        const params = Wavedash.getLaunchParams();
        if (params.lobby) {
            show($('accept-invite'));
            state.lobby = params.lobby;
        }
    }

    $('decline').addEventListener('click', (e) => {
        state.lobby = null;
        hide($('accept-invite'));
    });
};
export const unload = () => {
    hide($('accept-invite'));
};