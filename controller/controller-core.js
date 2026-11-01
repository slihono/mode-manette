// Independent input adapter: game data and mission scripts are never modified.
export const ACTIONS = [
	['forward', 'Avancer / accélérer', 'KeyW'], ['back', 'Reculer / freiner', 'KeyS'],
	['left', 'Aller à gauche', 'KeyA'], ['right', 'Aller à droite', 'KeyD'],
	['lookLeft', 'Caméra vers la gauche', 'look:-x'], ['lookRight', 'Caméra vers la droite', 'look:+x'],
	['lookUp', 'Caméra vers le haut', 'look:-y'], ['lookDown', 'Caméra vers le bas', 'look:+y'],
	['sprint', 'Courir', 'ShiftLeft'], ['jump', 'Sauter / frein à main', 'Space'],
	['vehicle', 'Entrer / sortir du véhicule', 'KeyF'], ['reload', 'Recharger', 'KeyR'],
	['cover', 'Se mettre à couvert', 'KeyQ'], ['interact', 'Interagir / klaxon', 'KeyE'],
	['weapons', 'Roue des armes', 'Tab'], ['aim', 'Viser', 'mouse:2'], ['fire', 'Tirer', 'mouse:1'],
	['pause', 'Pause / retour', 'Escape'], ['confirm', 'Valider', 'Enter'],
	['phone', 'Téléphone / haut', 'ArrowUp'], ['down', 'Bas', 'ArrowDown'],
	['menuLeft', 'Menu gauche', 'ArrowLeft'], ['menuRight', 'Menu droite', 'ArrowRight'],
	['lookBack', 'Regarder derrière', 'KeyC'], ['stealth', 'Discrétion', 'ControlLeft'],
	['characters', 'Choisir un personnage', 'AltLeft'], ['detonate', 'Faire détoner', 'KeyG'],
	['camera', 'Changer de vue', 'KeyV'], ['duck', 'Se baisser dans le véhicule', 'KeyX'],
	['cinematic', 'Caméra cinématique', 'KeyR'], ['radio', 'Roue des radios', 'KeyQ'],
	['headlights', 'Phares', 'KeyH'], ['nextWeapon', 'Arme suivante du véhicule', 'Tab'],
];

const button = (index) => ({ type: 'button', index });
const axis = (index, direction) => ({ type: 'axis', index, direction });
export const MODES = { foot: 'À pied', vehicle: 'En véhicule', menu: 'Menus' };

export function defaultProfile() {
	const foot = {
		forward: axis(1, -1), back: axis(1, 1), left: axis(0, -1), right: axis(0, 1),
		lookLeft: axis(2, -1), lookRight: axis(2, 1), lookUp: axis(3, -1), lookDown: axis(3, 1),
		sprint: button(0), reload: button(1), jump: button(2), vehicle: button(3),
		weapons: button(4), cover: button(5), aim: button(6), fire: button(7),
		stealth: button(10), interact: button(15), lookBack: button(11), pause: button(9),
		phone: button(12), characters: button(13), detonate: button(14),
		camera: [button(8), button(17)],
	};
	return {
		version: 1, enabled: true, mode: 'foot', deadzone: 0.2, sensitivity: 900,
		sets: {
			foot,
			vehicle: { ...foot, forward: button(7), back: button(6), aim: button(4), fire: null, weapons: null, cover: null, sprint: null, stealth: null,
				jump: button(5), duck: button(0), cinematic: button(1), nextWeapon: button(2), reload: null, interact: button(10), detonate: null, radio: button(14), headlights: button(15) },
			menu: { confirm: button(0), pause: [button(1), button(9)], phone: [axis(1, -1), button(12)], down: [axis(1, 1), button(13)], menuLeft: [axis(0, -1), button(14)], menuRight: [axis(0, 1), button(15)] },
		},
	};
}

export function validBinding(value) {
	if (Array.isArray(value)) return value.length > 0 && value.length <= 4 && value.every((item) => item !== null && !Array.isArray(item) && validBinding(item));
	return value === null || (!!value && Number.isInteger(value.index) && value.index >= 0 && value.index < 256 &&
		(value.type === 'button' || (value.type === 'axis' && [1, -1].includes(value.direction))));
}

export function validateProfile(value) {
	if (!value || value.version !== 1 || typeof value.enabled !== 'boolean' || !Object.hasOwn(MODES, value.mode)) throw new Error('Profil non reconnu.');
	if (!Number.isFinite(value.deadzone) || value.deadzone < 0.05 || value.deadzone > 0.8) throw new Error('Zone morte hors limites.');
	if (!Number.isFinite(value.sensitivity) || value.sensitivity < 100 || value.sensitivity > 3000) throw new Error('Sensibilité hors limites.');
	const sets = {};
	for (const mode of Object.keys(MODES)) {
		if (!value.sets?.[mode] || typeof value.sets[mode] !== 'object' || Array.isArray(value.sets[mode])) throw new Error('Jeu de commandes manquant.');
		sets[mode] = {};
		for (const [id] of ACTIONS) {
			// An older custom profile must not gain new shortcuts on occupied buttons.
			const binding = value.sets[mode][id] ?? null;
			if (!validBinding(binding)) throw new Error('Commande invalide : ' + id);
			const clean = (item) => item ? { type: item.type, index: item.index, ...(item.type === 'axis' ? { direction: item.direction } : {}) } : null;
			sets[mode][id] = Array.isArray(binding) ? binding.map(clean) : clean(binding);
		}
	}
	return { version: 1, enabled: value.enabled, mode: value.mode, deadzone: value.deadzone, sensitivity: value.sensitivity, sets };
}

export function bindingLabel(binding) {
	if (Array.isArray(binding)) return binding.map(bindingLabel).join(' ou ');
	if (!binding) return 'Non attribué';
	return binding.type === 'button' ? 'Bouton ' + binding.index : 'Axe ' + binding.index + (binding.direction > 0 ? ' +' : ' −');
}

export function bindingValue(gamepad, binding, deadzone) {
	if (!binding || !gamepad) return 0;
	if (Array.isArray(binding)) return Math.max(0, ...binding.map((item) => bindingValue(gamepad, item, deadzone)));
	if (binding.type === 'button') {
		const value = gamepad.buttons[binding.index];
		return value && (value.pressed || value.value > 0.5) ? 1 : 0;
	}
	const raw = (gamepad.axes[binding.index] ?? 0) * binding.direction;
	return Number.isFinite(raw) ? Math.max(0, Math.min(1, (raw - deadzone) / (1 - deadzone))) : 0;
}

// Resting trigger axes can report -1. Learn changes relative to their resting value.
export function learnBinding(gamepad, baseline) {
	if (!gamepad || !baseline) return null;
	for (let index = 0; index < gamepad.buttons.length; index++) {
		const value = gamepad.buttons[index];
		if ((value.pressed || value.value > 0.65) && !baseline.buttons[index]) return button(index);
	}
	for (let index = 0; index < gamepad.axes.length; index++) {
		const value = gamepad.axes[index], rest = baseline.axes[index] ?? 0;
		if (Number.isFinite(value) && Math.abs(value - rest) > 0.65 && Math.abs(value) > 0.5) return axis(index, value > 0 ? 1 : -1);
	}
	return null;
}

export function snapshot(gamepad) {
	return { axes: [...gamepad.axes], buttons: gamepad.buttons.map((b) => b.pressed || b.value > 0.5) };
}

export function isNeutral(gamepad, profile) {
	return ACTIONS.every(([id]) => bindingValue(gamepad, profile.sets[profile.mode][id], profile.deadzone) < 0.03);
}

export function emptyState() {
	return { keys: new Set(), buttons: 0, dx: 0, dy: 0, active: false };
}

export class ControllerMapper {
	constructor() { this.fractionX = 0; this.fractionY = 0; }
	reset() { this.fractionX = 0; this.fractionY = 0; return emptyState(); }
	sample(gamepad, profile, seconds) {
		if (!gamepad || gamepad.connected === false || !profile.enabled) return this.reset();
		const state = { ...emptyState(), active: true };
		const driveBy = profile.mode === 'vehicle' && bindingValue(gamepad, profile.sets.vehicle.aim, profile.deadzone) > 0.12;
		let lookX = 0, lookY = 0;
		for (const [id, , output] of ACTIONS) {
			const amount = bindingValue(gamepad, profile.sets[profile.mode][id], profile.deadzone);
			if (!amount) continue;
			if (output.startsWith('look:')) {
				const signed = Math.pow(amount, 1.5) * (output.includes('-') ? -1 : 1);
				if (output.endsWith('x')) lookX += signed; else lookY += signed;
			} else if (amount > 0.12) {
				// GTA's right bumper fires during a drive-by aim; otherwise it is the handbrake.
				if (id === 'jump' && driveBy) { state.buttons |= 1; continue; }
				if (output.startsWith('mouse:')) state.buttons |= Number(output.slice(6));
				else state.keys.add(output);
			}
		}
		const elapsed = Math.max(0, Math.min(0.05, Number.isFinite(seconds) ? seconds : 0));
		this.fractionX += lookX * profile.sensitivity * elapsed;
		this.fractionY += lookY * profile.sensitivity * elapsed;
		state.dx = Math.trunc(this.fractionX); state.dy = Math.trunc(this.fractionY);
		this.fractionX -= state.dx; this.fractionY -= state.dy;
		return state;
	}
}
