const N = {
        C: 32.70,
        D: 36.71,
        E: 41.20,
        F: 43.65,
        G: 48.99,
        A: 55.00,
        B: 61.74,
};

export default {
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