import { emptyState } from './controller-core.js';

const FLY_ALIAS = { KeyI: 'Numpad8', KeyK: 'Numpad2', KeyJ: 'Numpad4', KeyL: 'Numpad6', KeyU: 'Numpad7', KeyO: 'Numpad9' };

// Uses the input layout already exposed by the V1 page. Keyboard, mouse and pad
// retain separate ownership, so releasing one device cannot release another.
export class MemoryInputBridge {
	constructor({ keys, words, codes, getSize, isLocked }) {
		Object.assign(this, { keys, words, codes, getSize, isLocked });
		this.keyboard = new Set(); this.mouseButtons = 0; this.controller = emptyState();
	}
	refreshKey(code) {
		const vk = this.codes[code];
		if (!vk) return;
		let pressed = this.keyboard.has(code) || this.controller.keys.has(code);
		for (const [source, target] of Object.entries(FLY_ALIAS)) {
			if (target === code) pressed ||= this.keyboard.has(source) || this.controller.keys.has(source);
		}
		Atomics.store(this.keys, vk, pressed ? 0x80 : 0);
	}
	key(code, pressed) {
		if (pressed) this.keyboard.add(code); else this.keyboard.delete(code);
		this.refreshKey(code);
		if (FLY_ALIAS[code]) this.refreshKey(FLY_ALIAS[code]);
	}
	mouse(button, pressed) {
		const mapped = [0, 2, 1, 3, 4][button];
		if (mapped === undefined) return;
		if (pressed) this.mouseButtons |= 1 << mapped; else this.mouseButtons &= ~(1 << mapped);
		Atomics.store(this.words, 5, this.mouseButtons | this.controller.buttons);
	}
	syncLock() { Atomics.store(this.words, 7, this.isLocked() || this.controller.active ? 1 : 0); }
	update(state) {
		const previous = this.controller;
		this.controller = state;
		for (const code of new Set([...previous.keys, ...state.keys])) {
			this.refreshKey(code);
			if (FLY_ALIAS[code]) this.refreshKey(FLY_ALIAS[code]);
		}
		Atomics.store(this.words, 5, this.mouseButtons | state.buttons);
		this.syncLock();
		if (!state.dx && !state.dy) return;
		const [width, height] = this.getSize();
		Atomics.add(this.words, 2, state.dx); Atomics.add(this.words, 3, state.dy);
		Atomics.store(this.words, 0, Math.max(0, Math.min(width - 1, Atomics.load(this.words, 0) + state.dx)));
		Atomics.store(this.words, 1, Math.max(0, Math.min(height - 1, Atomics.load(this.words, 1) + state.dy)));
	}
	clear() {
		this.keyboard.clear(); this.mouseButtons = 0; this.controller = emptyState();
		for (let i = 0; i < 256; i++) Atomics.store(this.keys, i, 0);
		Atomics.store(this.words, 5, 0); this.syncLock();
	}
}
