import { createControllerUI } from './controller-ui.js';
import { MemoryInputBridge } from './controller-memory.js';
import { ControllerMapper, defaultProfile } from './controller-core.js';

const memory = new ArrayBuffer(512), keys = new Uint8Array(memory, 0, 256), words = new Int32Array(memory, 256, 10);
const codes = { ShiftLeft: 0xA0, ControlLeft: 0xA2, Space: 0x20, Tab: 9, Escape: 27, Enter: 13, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };
for (let i = 0; i < 26; i++) codes['Key' + String.fromCharCode(65 + i)] = 65 + i;
const bridge = new MemoryInputBridge({ keys, words, codes, getSize: () => [900, 220], isLocked: () => false });
const controller = createControllerUI({ mount: document.getElementById('controller-mount') });
controller.bindInput((state) => bridge.update(state), () => bridge.clear());
const canvas = document.getElementById('preview'), context = canvas.getContext('2d');
let x = 450, y = 110;
const render = () => {
	document.getElementById('keys').textContent = Object.entries(codes).filter(([, value]) => Atomics.load(keys, value)).map(([code]) => code.replace('Key', '')).join(' · ') || 'Aucune';
	const buttons = Atomics.load(words, 5);
	document.getElementById('buttons').textContent = [buttons & 2 ? 'Viser' : '', buttons & 1 ? 'Tirer' : ''].filter(Boolean).join(' · ') || 'Relâchés';
	document.getElementById('state').textContent = controller.isEditing() ? 'Configuration' : controller.getState().active ? 'Manette active' : 'En attente';
	x = Math.max(8, Math.min(892, x + Atomics.exchange(words, 2, 0))); y = Math.max(8, Math.min(212, y + Atomics.exchange(words, 3, 0)));
	context.clearRect(0, 0, 900, 220); context.strokeStyle = '#292929'; context.lineWidth = 1;
	for (let gx = 0; gx < 900; gx += 50) { context.beginPath(); context.moveTo(gx, 0); context.lineTo(gx, 220); context.stroke(); }
	context.strokeStyle = '#9ed296'; context.lineWidth = 2; context.beginPath(); context.moveTo(x - 10, y); context.lineTo(x + 10, y); context.moveTo(x, y - 10); context.lineTo(x, y + 10); context.stroke();
	requestAnimationFrame(render);
};
requestAnimationFrame(render);
document.getElementById('self-test').onclick = () => {
	// A virtual input sample validates the actual bridge without claiming a hardware test.
	const profile = defaultProfile(), mapper = new ControllerMapper();
	const pad = { connected: true, axes: [0, -1, 1, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 7, value: i === 7 ? 1 : 0 })) };
	const sample = mapper.sample(pad, profile, 1 / 60); bridge.update(sample);
	const passed = Atomics.load(keys, 87) === 128 && Atomics.load(words, 5) === 1 && Atomics.load(words, 2) > 0;
	bridge.update(mapper.reset());
	const released = Atomics.load(keys, 87) === 0 && Atomics.load(words, 5) === 0;
	document.getElementById('test-result').textContent = passed && released ? 'Réussi : avancer, tirer, caméra et relâchement vérifiés avec une entrée simulée. La manette physique reste à tester.' : 'Échec du branchement mémoire.';
};
