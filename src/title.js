import * as lobby from "./lobby.js";


export function loop() {

}

export const nav = [[document.getElementById('title'), lobby], [document.getElementById('join'), lobby]];

export const hud = document.getElementById('title');

export const bgm = () => {};
export const load = (state) => {
    if (window.Wavedash) {
        // Set user info in the game state
        state.username = Wavedash.getUsername();

        // Join MP session if in params
        const params = Wavedash.getLaunchParams();
        if (params.lobby) {
            document.getElementById('accept-invite').style.display = 'block';
            state.lobby = params.lobby;
        }
    }

    console.log('setting event...')
    document.getElementById('decline').addEventListener('click', (e) => {
        state.lobby = null;
        document.getElementById('accept-invite').style.display = 'none';
    });
};
export const unload = () => {
    document.getElementById('accept-invite').style.display = 'none';
};