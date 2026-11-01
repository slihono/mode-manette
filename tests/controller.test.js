import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, ControllerMapper, defaultProfile, validateProfile, snapshot, learnBinding, isNeutral } from '../controller/controller-core.js';
import { MemoryInputBridge } from '../controller/controller-memory.js';
import { CONTROLS, controlLabel } from '../controller/controller-layout.js';

function pad(axes = [0, 0, 0, 0], buttons = []) {
	return { connected: true, axes, buttons: Array.from({ length: 20 }, (_, i) => ({ pressed: buttons.includes(i), value: buttons.includes(i) ? 1 : 0 })) };
}
function bridgeFixture() {
	const memory = new SharedArrayBuffer(512), keys = new Uint8Array(memory, 0, 256), words = new Int32Array(memory, 256, 10);
	const bridge = new MemoryInputBridge({ keys, words, codes: { KeyW: 87, KeyI: 73, Numpad8: 104 }, getSize: () => [100, 100], isLocked: () => false });
	return { bridge, keys, words };
}

test('walking uses the existing W key and triggers use the V1 mouse bit order', () => {
	const state = new ControllerMapper().sample(pad([0, -1, 0, 0], [6, 7]), defaultProfile(), 1 / 60);
	assert.deepEqual([...state.keys], ['KeyW']); assert.equal(state.buttons, 3);
});
test('resting sticks and small drift do not produce gameplay commands', () => {
	const state = new ControllerMapper().sample(pad([0.1, -0.15, 0.19, -0.19]), defaultProfile(), 1 / 60);
	assert.equal(state.keys.size, 0); assert.equal(state.dx, 0); assert.equal(state.dy, 0);
});
test('camera travel is independent of 60 or 120 Hz with fractional accumulation', () => {
	const travel = (fps) => {
		const mapper = new ControllerMapper(); let result = 0;
		for (let i = 0; i < fps; i++) result += mapper.sample(pad([0, 0, 0.7, 0]), defaultProfile(), 1 / fps).dx;
		return result;
	};
	assert.ok(travel(60) > 0); assert.ok(Math.abs(travel(60) - travel(120)) <= 1);
});
test('a suspended tab cannot cause a large camera jump', () => {
	assert.equal(new ControllerMapper().sample(pad([0, 0, 1, 0]), defaultProfile(), 20).dx, 45);
});
test('disconnect and disable release all controller commands', () => {
	const mapper = new ControllerMapper(), profile = defaultProfile();
	mapper.sample(pad([0, -1, 0, 0], [7]), profile, 0.01);
	for (const state of [mapper.sample(null, profile, 0.01), mapper.sample({ ...pad(), connected: false }, profile, 0.01), mapper.sample(pad(), { ...profile, enabled: false }, 0.01)]) {
		assert.equal(state.active, false); assert.equal(state.keys.size, 0); assert.equal(state.buttons, 0);
	}
});
test('vehicle mode puts acceleration and braking on triggers without firing', () => {
	const state = new ControllerMapper().sample(pad([0, 0, 0, 0], [6, 7]), { ...defaultProfile(), mode: 'vehicle' }, 0.01);
	assert.equal(state.keys.has('KeyW'), true); assert.equal(state.keys.has('KeyS'), true); assert.equal(state.buttons, 0);
});
test('GTA vehicle right bumper is handbrake, and becomes fire while aiming', () => {
	const mapper = new ControllerMapper(), profile = { ...defaultProfile(), mode: 'vehicle' };
	const braking = mapper.sample(pad([0, 0, 0, 0], [5]), profile, 0.01);
	assert.equal(braking.keys.has('Space'), true); assert.equal(braking.buttons, 0);
	const firing = mapper.sample(pad([0, 0, 0, 0], [4, 5]), profile, 0.01);
	assert.equal(firing.keys.has('Space'), false); assert.equal(firing.buttons, 3);
});
test('GTA face buttons, stealth and view controls have the expected default output', () => {
	const mapper = new ControllerMapper(), profile = defaultProfile();
	for (const [input, output] of [[0, 'ShiftLeft'], [1, 'KeyR'], [2, 'Space'], [3, 'KeyF'], [10, 'ControlLeft'], [17, 'KeyV'], [8, 'KeyV']]) assert.equal(mapper.sample(pad([0, 0, 0, 0], [input]), profile, 0.01).keys.has(output), true);
});
test('menu navigation works from both the d-pad and left stick', () => {
	const mapper = new ControllerMapper(), profile = { ...defaultProfile(), mode: 'menu' };
	assert.equal(mapper.sample(pad([0, -1, 0, 0]), profile, 0.01).keys.has('ArrowUp'), true);
	assert.equal(mapper.sample(pad([0, 0, 0, 0], [12]), profile, 0.01).keys.has('ArrowUp'), true);
	assert.equal(mapper.sample(pad([0, 0, 0, 0], [0]), profile, 0.01).keys.has('Enter'), true);
});
test('custom unstandardized axes and buttons can replace all default inputs', () => {
	const profile = defaultProfile(); profile.sets.foot.forward = { type: 'button', index: 19 };
	profile.sets.foot.lookRight = { type: 'axis', index: 5, direction: -1 };
	const state = new ControllerMapper().sample(pad([0, 0, 0, 0, 0, -1], [19]), validateProfile(profile), 0.01);
	assert.equal(state.keys.has('KeyW'), true); assert.equal(state.dx, 9);
});
test('missing axes and buttons are ignored on smaller controllers', () => {
	const state = new ControllerMapper().sample({ connected: true, axes: [], buttons: [] }, defaultProfile(), 0.01);
	assert.equal(state.keys.size, 0); assert.equal(state.buttons, 0); assert.equal(state.dx, 0);
});
test('camera sticks must also return to neutral before resuming', () => {
	assert.equal(isNeutral(pad(), defaultProfile()), true);
	assert.equal(isNeutral(pad([0, 0, 1, 0]), defaultProfile()), false);
	assert.equal(isNeutral(pad([0, 0, 0, 0], [7]), defaultProfile()), false);
});
test('learning ignores already-held buttons and detects unusual axes', () => {
	const baseline = snapshot(pad([0, 0, 0, 0, -1], [2]));
	assert.equal(learnBinding(pad([0, 0, 0, 0, -1], [2]), baseline), null);
	assert.deepEqual(learnBinding(pad([0, 0, 0, 0, -1], [2, 19]), baseline), { type: 'button', index: 19 });
	assert.deepEqual(learnBinding(pad([0, 0, 0, 0, 1], [2]), baseline), { type: 'axis', index: 4, direction: 1 });
});
test('profile imports reject malformed values and drop unknown properties', () => {
	for (const change of [{ mode: '__proto__' }, { sensitivity: Infinity }, { deadzone: 1 }, { enabled: 'yes' }, { version: 2 }, { sets: null }]) assert.throws(() => validateProfile({ ...defaultProfile(), ...change }));
	const profile = defaultProfile(); profile.sets.foot.fire = { type: 'script', index: 0 };
	assert.throws(() => validateProfile(profile));
	const clean = validateProfile({ ...defaultProfile(), unknown: 'ignored' });
	assert.equal(Object.hasOwn(clean, 'unknown'), false); assert.equal(Object.keys(clean.sets.foot).length, ACTIONS.length);
});
test('alternative input bindings survive exports while nested or unbounded arrays are rejected', () => {
	const restored = validateProfile(JSON.parse(JSON.stringify(defaultProfile())));
	assert.equal(restored.sets.foot.camera.length, 2);
	for (const bad of [[], [[{ type: 'button', index: 1 }]], Array.from({ length: 5 }, () => ({ type: 'button', index: 1 }))]) {
		const profile = defaultProfile(); profile.sets.foot.camera = bad; assert.throws(() => validateProfile(profile));
	}
});
test('older custom profiles retain their choices when new actions are introduced', () => {
	const original = defaultProfile(); delete original.sets.foot.camera;
	original.sets.foot.fire = { type: 'button', index: 17 }; original.sets.foot.stealth = null;
	const upgraded = validateProfile(original);
	assert.equal(upgraded.sets.foot.fire.index, 17); assert.equal(upgraded.sets.foot.stealth, null); assert.equal(upgraded.sets.foot.camera, null);
});
test('every diagram control refers to real actions and has a unique physical region', () => {
	const ids = new Set(ACTIONS.map(([id]) => id)), seen = new Set();
	for (const control of CONTROLS) {
		assert.equal(seen.has(control.id), false); seen.add(control.id);
		assert.ok(control.x > 0 && control.x < 100 && control.y > 0 && control.y < 100);
		for (const actions of Object.values(control.actions)) for (const id of actions) assert.ok(ids.has(id), id);
	}
	const labels = Object.fromEntries(ACTIONS.map(([id, label]) => [id, label]));
	const r2 = CONTROLS.find((control) => control.id === 'r2');
	assert.equal(controlLabel(r2, 'foot', labels), 'Tirer'); assert.equal(controlLabel(r2, 'vehicle', labels), 'Accélérer');
});
test('keyboard and controller retain independent ownership of the same key', () => {
	const { bridge, keys } = bridgeFixture(), mapper = new ControllerMapper();
	bridge.key('KeyW', true); bridge.update(mapper.sample(pad([0, -1, 0, 0]), defaultProfile(), 0.01));
	bridge.key('KeyW', false); assert.equal(keys[87], 128);
	bridge.key('KeyW', true); bridge.update(mapper.reset()); assert.equal(keys[87], 128);
	bridge.key('KeyW', false); assert.equal(keys[87], 0);
});
test('mouse and trigger releases cannot cancel the other device', () => {
	const { bridge, words } = bridgeFixture(), mapper = new ControllerMapper();
	bridge.mouse(0, true); bridge.update(mapper.sample(pad([0, 0, 0, 0], [7]), defaultProfile(), 0.01));
	bridge.mouse(0, false); assert.equal(words[5], 1);
	bridge.mouse(0, true); bridge.update(mapper.reset()); assert.equal(words[5], 1);
	bridge.mouse(0, false); assert.equal(words[5], 0);
});
test('existing aircraft keyboard aliases survive alongside the controller', () => {
	const { bridge, keys } = bridgeFixture();
	bridge.key('KeyI', true); bridge.key('Numpad8', true); bridge.key('KeyI', false); assert.equal(keys[104], 128);
	bridge.key('Numpad8', false); assert.equal(keys[104], 0);
});
test('camera deltas reach shared memory and positions stay within the viewport', () => {
	const { bridge, words } = bridgeFixture(), mapper = new ControllerMapper();
	words[0] = 95; words[1] = 2;
	bridge.update(mapper.sample(pad([0, 0, 1, -1]), defaultProfile(), 0.05));
	assert.equal(words[2], 45); assert.equal(words[3], -45); assert.equal(words[0], 99); assert.equal(words[1], 0); assert.equal(words[7], 1);
	bridge.update(mapper.reset()); assert.equal(words[7], 0);
});
test('opening settings or losing focus clears keyboard, mouse and controller together', () => {
	const { bridge, keys, words } = bridgeFixture(), mapper = new ControllerMapper();
	bridge.key('KeyW', true); bridge.mouse(2, true); bridge.update(mapper.sample(pad([0, -1, 0, 0], [7]), defaultProfile(), 0.01));
	bridge.clear(); assert.equal(keys.some(Boolean), false); assert.equal(words[5], 0); assert.equal(words[7], 0);
});
