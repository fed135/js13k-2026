/** @type {Object|undefined} */
window.Wavedash;

/** 
 * @type {function(): void} 
 */
window.Wavedash.init;

/** 
 * @type {function(lobby: string, msg: string): void} 
 */
window.Wavedash.sendLobbyMessage;

/** 
 * @type {function(event: string, handler: function): void} 
 */
window.Wavedash.on;

/** 
 * @type {function(event: string, handler: function): void} 
 */
window.Wavedash.off;

/** 
 * @type {function(): object} 
 */
window.Wavedash.getLobbyUsers

/** 
 * @type {function(): string} 
 */
window.Wavedash.getUserId

/** 
 * @type {function(): string} 
 */
window.Wavedash.getUsername

/** 
 * @type {function(): object} 
 */
window.Wavedash.getLaunchParams

/** 
 * @type {function(type: number, players: number): Promise} 
 */
window.Wavedash.createLobby

/** 
 * @type {function(lobby: string): Promise} 
 */
window.Wavedash.joinLobby

/** 
 * @type {function(lobby: string, key: string, value: string): void} 
 */
window.Wavedash.setLobbyData

/** 
 * @type {function(lobby: string, key: string): string} 
 */
window.Wavedash.getLobbyData

/** 
 * @type {function(something: boolean): Promise} 
 */
window.Wavedash.getLobbyInviteLink

/**
 * @type {function(color: string): void} 
 */
window.updateColor

/**
 * @type {function(name: string): void} 
 */
window.updateName