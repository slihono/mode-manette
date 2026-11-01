// Logical GTA controls. Physical bindings remain editable for custom controllers.
export const CONTROLS = [
	{ id: 'l2', ps: 'L2', xbox: 'LT', part: 'Gâchette gauche', x: 29.5, y: 10.5, width: 13, height: 7, side: 'left', actions: { foot: ['aim'], vehicle: ['back'], menu: [] } },
	{ id: 'l1', ps: 'L1', xbox: 'LB', part: 'Bouton supérieur gauche', x: 29.5, y: 18.5, width: 14, height: 7, side: 'left', actions: { foot: ['weapons'], vehicle: ['aim'], menu: [] } },
	{ id: 'dpad', ps: '✚', xbox: '✚', part: 'Croix directionnelle', x: 27, y: 43, width: 17, height: 25, side: 'left', actions: { foot: ['phone', 'characters', 'detonate', 'interact'], vehicle: ['phone', 'characters', 'radio', 'headlights'], menu: ['phone', 'down', 'menuLeft', 'menuRight'] } },
	{ id: 'leftStick', ps: 'L', xbox: 'LS', part: 'Stick gauche', x: 39, y: 62, width: 16, height: 27, side: 'left', kind: 'stick', actions: { foot: ['forward', 'back', 'left', 'right'], vehicle: ['left', 'right'], menu: ['phone', 'down', 'menuLeft', 'menuRight'] } },
	{ id: 'l3', ps: 'L3', xbox: 'LS', part: 'Appui sur le stick gauche', x: 39, y: 80, width: 9, height: 7, side: 'left', actions: { foot: ['stealth'], vehicle: ['interact'], menu: [] } },
	{ id: 'r2', ps: 'R2', xbox: 'RT', part: 'Gâchette droite', x: 70.5, y: 10.5, width: 13, height: 7, side: 'right', actions: { foot: ['fire'], vehicle: ['forward'], menu: [] } },
	{ id: 'r1', ps: 'R1', xbox: 'RB', part: 'Bouton supérieur droit', x: 70.5, y: 18.5, width: 14, height: 7, side: 'right', actions: { foot: ['cover'], vehicle: ['jump'], menu: [] } },
	{ id: 'triangle', ps: '△', xbox: 'Y', part: 'Touche du haut', x: 73, y: 33, width: 8, height: 13.5, side: 'right', kind: 'face', actions: { foot: ['vehicle'], vehicle: ['vehicle'], menu: [] } },
	{ id: 'circle', ps: '○', xbox: 'B', part: 'Touche de droite', x: 79, y: 43, width: 8, height: 13.5, side: 'right', kind: 'face', actions: { foot: ['reload'], vehicle: ['cinematic'], menu: ['pause'] } },
	{ id: 'square', ps: '□', xbox: 'X', part: 'Touche de gauche', x: 67, y: 43, width: 8, height: 13.5, side: 'right', kind: 'face', actions: { foot: ['jump'], vehicle: ['nextWeapon'], menu: [] } },
	{ id: 'cross', ps: '×', xbox: 'A', part: 'Touche du bas', x: 73, y: 53, width: 8, height: 13.5, side: 'right', kind: 'face', actions: { foot: ['sprint'], vehicle: ['duck'], menu: ['confirm'] } },
	{ id: 'rightStick', ps: 'R', xbox: 'RS', part: 'Stick droit', x: 61, y: 62, width: 16, height: 27, side: 'right', kind: 'stick', actions: { foot: ['lookLeft', 'lookRight', 'lookUp', 'lookDown'], vehicle: ['lookLeft', 'lookRight', 'lookUp', 'lookDown'], menu: [] } },
	{ id: 'r3', ps: 'R3', xbox: 'RS', part: 'Appui sur le stick droit', x: 61, y: 80, width: 9, height: 7, side: 'right', actions: { foot: ['lookBack'], vehicle: ['lookBack'], menu: [] } },
	{ id: 'touch', ps: 'PAVÉ', xbox: 'VIEW', part: 'Pavé tactile / bouton de vue', x: 50, y: 33.5, width: 20, height: 18, actions: { foot: ['camera'], vehicle: ['camera'], menu: [] } },
	{ id: 'options', ps: 'OPTIONS', xbox: 'MENU', part: 'Bouton de pause', x: 63.3, y: 29, width: 5, height: 10, actions: { foot: ['pause'], vehicle: ['pause'], menu: ['pause'] } },
];

export const actionLabel = (id, mode) => {
	if (id === 'forward') return mode === 'vehicle' ? 'Accélérer' : 'Avancer';
	if (id === 'back') return mode === 'vehicle' ? 'Freiner / reculer' : 'Reculer';
	if (id === 'jump') return mode === 'vehicle' ? 'Frein à main' : 'Sauter / escalader';
	if (id === 'vehicle') return mode === 'vehicle' ? 'Sortir du véhicule' : 'Entrer dans un véhicule';
	if (id === 'interact') return mode === 'vehicle' ? 'Klaxon' : 'Interagir';
	if (id === 'aim' && mode === 'vehicle') return 'Viser depuis le véhicule';
	if (id === 'phone' && mode === 'menu') return 'Haut';
	return null;
};

export function controlLabel(control, mode, labels) {
	if (control.id === 'leftStick') return mode === 'vehicle' ? 'Diriger' : mode === 'menu' ? 'Naviguer' : 'Se déplacer';
	if (control.id === 'rightStick') return mode === 'menu' ? 'Non utilisé' : 'Regarder autour';
	if (control.id === 'dpad') return mode === 'menu' ? 'Naviguer dans les menus' : 'Téléphone et actions';
	const action = control.actions[mode][0];
	return action ? actionLabel(action, mode) || labels[action] : 'Non utilisé';
}
