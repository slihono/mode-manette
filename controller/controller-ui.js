import { ACTIONS, MODES, ControllerMapper, defaultProfile, validateProfile, bindingLabel, bindingValue, learnBinding, snapshot, isNeutral, emptyState } from './controller-core.js';
import { CONTROLS, actionLabel, controlLabel } from './controller-layout.js';

const STORAGE = 'fiveplay-controller-v1:';
const LABELS = Object.fromEntries(ACTIONS.map(([id, label]) => [id, label]));
const element = (tag, text = '', props = {}) => Object.assign(document.createElement(tag), { textContent: text, ...props });
const button = (text, className = '') => element('button', text, { type: 'button', className });

export function createControllerUI({ mount = null, readGamepads = () => { if (!navigator.getGamepads) throw new Error('Gamepad API unavailable'); return navigator.getGamepads(); } } = {}) {
	const style = element('link', '', { rel: 'stylesheet', href: new URL('./controller.css', import.meta.url).href }); document.head.append(style);
	const launch = button('MANETTE', 'pad-launch');
	const root = element(mount ? 'section' : 'dialog', '', { className: mount ? 'pad-workbench' : 'pad-dialog' });
	root.setAttribute('aria-labelledby', 'pad-title');
	const header = element('header', '', { className: 'pad-header' });
	const heading = element('div'); heading.append(element('p', 'FIVEPLAY / CONTROLLER', { className: 'pad-eyebrow' }), element('h2', 'Les commandes, en un coup d’œil.', { id: 'pad-title' }));
	const close = button('×', 'pad-close'); close.setAttribute('aria-label', 'Fermer la configuration'); close.hidden = !!mount;
	header.append(heading, close);
	const intro = element('p', 'Clique sur une touche pour voir son rôle ou changer son attribution.', { className: 'pad-intro' });
	const toolbar = element('div', '', { className: 'pad-toolbar' });
	const modes = element('div', '', { className: 'pad-modes' }); modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Situation dans le jeu');
	const modeButtons = new Map();
	for (const [id, label] of Object.entries(MODES)) { const item = button(label); item.dataset.mode = id; modes.append(item); modeButtons.set(id, item); }
	const symbols = element('select', '', { id: 'pad-symbols' }); symbols.setAttribute('aria-label', 'Symboles de la manette');
	symbols.append(element('option', 'PlayStation', { value: 'ps' }), element('option', 'Xbox', { value: 'xbox' }));
	toolbar.append(modes, symbols);
	const status = element('div', 'Branche ta manette et appuie sur un bouton.', { className: 'pad-status' }); status.setAttribute('role', 'status');
	const scroll = element('div', '', { className: 'pad-content' });
	const figure = element('div', '', { className: 'pad-figure' }); figure.setAttribute('role', 'group'); figure.setAttribute('aria-label', 'Schéma interactif de la manette');
	const left = element('div', '', { className: 'pad-callouts pad-callouts-left' });
	const right = element('div', '', { className: 'pad-callouts pad-callouts-right' });
	const controller = element('div', '', { className: 'pad-controller' });
	const art = element('img', '', { src: new URL('./controller-diagram.svg', import.meta.url).href, alt: '', className: 'pad-art' }); art.setAttribute('aria-hidden', 'true'); controller.append(art);
	const svgNS = 'http://www.w3.org/2000/svg', leaders = document.createElementNS(svgNS, 'svg'); leaders.classList.add('pad-leaders'); leaders.setAttribute('aria-hidden', 'true');
	figure.append(leaders, left, controller, right);
	const inspector = element('section', '', { className: 'pad-inspector' }); inspector.setAttribute('aria-label', 'Réglage de la touche sélectionnée');
	const inspectorTop = element('div', '', { className: 'pad-selection' });
	const selectedSymbol = element('span', '', { className: 'pad-selected-symbol' }); selectedSymbol.setAttribute('aria-hidden', 'true');
	const selectedText = element('div'); const selectedPart = element('p', '', { className: 'pad-part' }), selectedTitle = element('h3'); selectedText.append(selectedPart, selectedTitle); inspectorTop.append(selectedSymbol, selectedText);
	const selectedDescription = element('p', '', { className: 'pad-description' });
	const directions = element('div', '', { className: 'pad-directions' }); directions.setAttribute('role', 'group'); directions.setAttribute('aria-label', 'Direction à configurer');
	const editTools = element('div', '', { className: 'pad-edit-tools' });
	const learn = button('Changer cette touche', 'pad-primary'), cancel = button('Annuler'), restore = button('Par défaut', 'pad-subtle'); cancel.hidden = true;
	const feedback = element('p', '', { className: 'pad-feedback', id: 'pad-feedback', hidden: true }); learn.setAttribute('aria-describedby', 'pad-feedback');
	editTools.append(learn, cancel, restore); inspector.append(inspectorTop, selectedDescription, directions, editTools, feedback);
	const advanced = element('details', '', { className: 'pad-advanced' }); advanced.append(element('summary', 'Réglages avancés'));
	const fields = element('div', '', { className: 'pad-fields' });
	const device = element('select', '', { id: 'pad-device' });
	const enabled = element('input', '', { id: 'pad-enabled', type: 'checkbox', checked: true });
	const deadzone = element('input', '', { id: 'pad-deadzone', type: 'range', min: '5', max: '80', step: '1' });
	const sensitivity = element('input', '', { id: 'pad-sensitivity', type: 'range', min: '100', max: '3000', step: '50' });
	const deadzoneText = element('output'), sensitivityText = element('output');
	const addField = (name, control) => { const box = element('div', '', { className: 'pad-field' }); const label = element('label', name); label.htmlFor = control.id; box.append(label, control); fields.append(box); return box; };
	addField('Manette détectée', device); addField('Activer la manette', enabled);
	addField('Zone morte', deadzone).append(deadzoneText); addField('Sensibilité caméra', sensitivity).append(sensitivityText);
	const currentBinding = element('p', '', { className: 'pad-binding' }), live = element('p', '', { className: 'pad-live' });
	const importNote = element('p', '', { className: 'pad-feedback' }); importNote.setAttribute('role', 'status');
	const advancedTools = element('div', '', { className: 'pad-tools' });
	const reset = button('Rétablir les commandes GTA V'), exportButton = button('Exporter le profil'), importButton = button('Importer un profil');
	const file = element('input', '', { type: 'file', accept: '.json,application/json', hidden: true });
	advancedTools.append(reset, exportButton, importButton, file); advanced.append(fields, currentBinding, live, advancedTools, importNote);
	const footer = element('p', 'Profils enregistrés automatiquement · Choisis la situation en haut quand tu entres dans un véhicule.', { className: 'pad-footer' });
	scroll.append(figure, inspector, advanced, footer); root.append(header, intro, toolbar, status, scroll);
	if (mount) mount.append(root); else document.body.append(launch, root);
	let profile = defaultProfile(), pads = [], selectedIndex = null, identity = '', learning = null, family = 'ps';
	let selected = 'r2', selectedAction = 'fire', devicesKey = null, destroyed = false, suspended = true, pollFailed = false;
	try { if (localStorage.getItem('fiveplay-controller-symbols') === 'xbox') family = 'xbox'; } catch { /* Symbol preference is optional. */ }
	let writeInput = () => {}, clearPhysical = () => {}, state = emptyState(), last = 0, lastDisplay = 0;
	const mapper = new ControllerMapper(), points = new Map(), labels = new Map(), lines = new Map();
	const modalOpen = () => !mount && root.open;
	const storageKey = () => STORAGE + (identity || 'default');
	const labelFor = (id) => actionLabel(id, profile.mode) || LABELS[id];
	const controlFor = () => CONTROLS.find((item) => item.id === selected);
	const release = () => { state = mapper.reset(); writeInput(state); };
	const message = (text, detail = false) => { status.textContent = text; if (detail) { feedback.hidden = false; feedback.textContent = text; } };
	const save = () => {
		try { localStorage.setItem(storageKey(), JSON.stringify(profile)); }
		catch { message('Réglages appliqués. Exporte le profil pour les conserver : le stockage local est indisponible.'); }
	};
	const drawLines = () => {
		const box = figure.getBoundingClientRect(); if (!box.width || !box.height) return;
		leaders.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
		for (const [id, label] of labels) {
			if (!label.getClientRects().length) continue;
			const a = label.getBoundingClientRect(), b = points.get(id).getBoundingClientRect();
			const isLeft = CONTROLS.find((item) => item.id === id).side === 'left';
			const x1 = (isLeft ? a.right : a.left) - box.left, y1 = a.top + a.height / 2 - box.top;
			const x2 = b.left + b.width / 2 - box.left, y2 = b.top + b.height / 2 - box.top;
			lines.get(id).setAttribute('d', `M ${x1} ${y1} H ${x1 + (isLeft ? 14 : -14)} L ${x2} ${y2}`);
		}
	};
	const highlight = (id) => { for (const [key, line] of lines) line.classList.toggle('is-highlighted', key === id); };
	const renderInspector = () => {
		const control = controlFor(), actions = control.actions[profile.mode];
		if (!actions.includes(selectedAction)) selectedAction = actions[0] || null;
		selectedSymbol.textContent = control[family]; selectedSymbol.dataset.control = selected;
		selectedPart.textContent = control.part;
		selectedTitle.textContent = controlLabel(control, profile.mode, LABELS);
		if (actions.length > 1) selectedDescription.textContent = 'Choisis une direction, puis utilise « Changer cette touche » pour l’associer à ta manette.';
		else if (!selectedAction) selectedDescription.textContent = 'Cette touche n’est pas utilisée dans ce profil.';
		else if (selected === 'l1') selectedDescription.textContent = profile.mode === 'foot' ? 'Maintiens cette touche pour ouvrir la roue des armes.' : 'Maintiens cette touche pour viser depuis le véhicule.';
		else if (selected === 'r1' && profile.mode === 'vehicle') selectedDescription.textContent = 'Frein à main. Si tu maintiens aussi L1 / LB pour viser, cette touche permet de tirer.';
		else if (selected === 'l3' || selected === 'r3') selectedDescription.textContent = 'Appuie sur le stick, comme sur un bouton.';
		else selectedDescription.textContent = 'Commande dans le jeu : ' + labelFor(selectedAction).toLowerCase() + '.';
		directions.replaceChildren(); directions.hidden = actions.length < 2;
		for (const id of actions) {
			const item = button(labelFor(id)); item.setAttribute('aria-pressed', String(id === selectedAction));
			item.onclick = () => { learning = null; selectedAction = id; renderInspector(); }; directions.append(item);
		}
		learn.textContent = learning ? 'En attente de ta commande…' : actions.length > 1 ? 'Changer cette direction' : 'Changer cette touche';
		learn.disabled = !selectedAction || !!learning; cancel.hidden = !learning; restore.disabled = !selectedAction;
		currentBinding.textContent = selectedAction ? 'Reconnaissance actuelle : ' + bindingLabel(profile.sets[profile.mode][selectedAction]) : 'Aucune attribution dans ce profil.';
		for (const [id, point] of points) {
			point.setAttribute('aria-pressed', String(id === selected)); point.classList.toggle('is-selected', id === selected);
			labels.get(id)?.setAttribute('aria-pressed', String(id === selected));
		}
		highlight(selected);
	};
	const refresh = () => {
		for (const [id, item] of modeButtons) item.setAttribute('aria-pressed', String(id === profile.mode));
		enabled.checked = profile.enabled; symbols.value = family;
		deadzone.value = Math.round(profile.deadzone * 100); deadzoneText.textContent = deadzone.value + ' %';
		sensitivity.value = profile.sensitivity; sensitivityText.textContent = sensitivity.value + ' px/s';
		for (const control of CONTROLS) {
			const point = points.get(control.id), text = controlLabel(control, profile.mode, LABELS);
			point.querySelector('span').textContent = control[family]; point.setAttribute('aria-label', control[family] + ' — ' + text);
			point.classList.toggle('is-unused', !control.actions[profile.mode].length);
			if (labels.has(control.id)) { const label = labels.get(control.id); label.querySelector('.pad-key').textContent = control[family]; label.querySelector('.pad-callout-text').textContent = text; label.setAttribute('aria-label', control[family] + ' — ' + text); }
		}
		renderInspector(); requestAnimationFrame(drawLines);
	};
	const setProfile = (value) => { const validated = validateProfile(value); release(); clearPhysical(); profile = validated; learning = null; suspended = true; save(); refresh(); };
	const selectControl = (control) => { learning = null; feedback.hidden = true; selected = control.id; selectedAction = control.actions[profile.mode][0] || null; renderInspector(); };
	for (const control of CONTROLS) {
		const point = button('', 'pad-point pad-point-' + (control.kind || 'button')); point.dataset.control = control.id;
		point.style.cssText = `--x:${control.x}%;--y:${control.y}%;--w:${control.width}%;--h:${control.height}%`;
		const glyph = element('span', control.ps); glyph.setAttribute('aria-hidden', 'true'); point.append(glyph);
		point.onclick = () => selectControl(control); point.onmouseenter = () => highlight(control.id); point.onmouseleave = () => highlight(selected); point.onfocus = () => highlight(control.id);
		points.set(control.id, point); controller.append(point);
		if (control.side) {
			const label = button('', 'pad-callout'); label.dataset.control = control.id; label.tabIndex = -1;
			label.append(element('span', control.ps, { className: 'pad-key' }), element('span', '', { className: 'pad-callout-text' }));
			label.onclick = () => selectControl(control); label.onmouseenter = () => highlight(control.id); label.onmouseleave = () => highlight(selected); label.onfocus = () => highlight(control.id);
			(control.side === 'left' ? left : right).append(label); labels.set(control.id, label);
			const line = document.createElementNS(svgNS, 'path'); leaders.append(line); lines.set(control.id, line);
		}
	}
	const loadDevice = (pad) => {
		release(); clearPhysical(); identity = pad?.id || ''; learning = null; suspended = true;
		try { const stored = localStorage.getItem(storageKey()); profile = stored ? validateProfile(JSON.parse(stored)) : defaultProfile(); }
		catch { profile = defaultProfile(); message('Ancien profil illisible : commandes GTA V chargées.'); }
		refresh();
	};
	const open = () => {
		release(); clearPhysical(); learning = null; suspended = true;
		if (document.pointerLockElement) document.exitPointerLock();
		if (mount) root.scrollIntoView({ block: 'start' }); else if (!root.open) root.showModal();
		refresh();
	};
	launch.onclick = open; close.onclick = () => root.close();
	if (!mount) {
		root.addEventListener('close', () => { learning = null; release(); suspended = true; launch.focus(); });
		root.addEventListener('cancel', (event) => { if (learning) { event.preventDefault(); learning = null; message('Modification annulée.'); renderInspector(); } });
	}
	for (const [id, item] of modeButtons) item.onclick = () => {
		if (!controlFor().actions[id].length) { selected = id === 'menu' ? 'cross' : 'r2'; selectedAction = null; }
		setProfile({ ...profile, mode: id }); message('Profil ' + MODES[id].toLowerCase() + ' sélectionné.');
	};
	symbols.onchange = () => { family = symbols.value; try { localStorage.setItem('fiveplay-controller-symbols', family); } catch { /* Keep the selected symbols for this session. */ } refresh(); };
	learn.onclick = () => {
		const pad = pads.find((p) => p.index === selectedIndex);
		if (!pad) { message('Branche ta manette, puis appuie sur un bouton pour pouvoir modifier cette touche.', true); return; }
		learning = { id: selectedAction, baseline: snapshot(pad), until: performance.now() + 10000 }; release();
		message('Utilise maintenant le bouton ou le stick souhaité sur ta manette.', true); renderInspector();
	};
	cancel.onclick = () => { learning = null; message('Modification annulée.', true); renderInspector(); };
	restore.onclick = () => {
		const defaults = defaultProfile();
		setProfile({ ...profile, sets: { ...profile.sets, [profile.mode]: { ...profile.sets[profile.mode], [selectedAction]: defaults.sets[profile.mode][selectedAction] ?? null } } }); message('Commande par défaut rétablie.');
	};
	device.onchange = () => { selectedIndex = Number(device.value); loadDevice(pads.find((p) => p.index === selectedIndex)); };
	enabled.onchange = () => setProfile({ ...profile, enabled: enabled.checked });
	deadzone.oninput = () => setProfile({ ...profile, deadzone: Number(deadzone.value) / 100 });
	sensitivity.oninput = () => setProfile({ ...profile, sensitivity: Number(sensitivity.value) });
	reset.onclick = () => { setProfile(defaultProfile()); message('Commandes GTA V rétablies.'); };
	exportButton.onclick = () => {
		const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
		const link = element('a', '', { href: url, download: 'fiveplay-manette.json' }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
	};
	importButton.onclick = () => file.click();
	file.onchange = async () => {
		try {
			const chosen = file.files[0]; if (!chosen) return;
			if (chosen.size > 65536) throw new Error('Le profil doit faire moins de 64 Ko.');
			setProfile(JSON.parse(await chosen.text())); importNote.textContent = 'Profil importé et enregistré.'; message(importNote.textContent);
		} catch (error) { importNote.textContent = 'Import impossible : ' + error.message; message(importNote.textContent); }
		finally { file.value = ''; }
	};
	const pause = () => { release(); clearPhysical(); suspended = true; };
	window.addEventListener('blur', pause); document.addEventListener('visibilitychange', pause);
	const blockedEvents = ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'wheel', 'contextmenu'];
	const blockGameEvents = (event) => { if (modalOpen() && !event.composedPath().includes(root)) event.stopImmediatePropagation(); };
	const stopAtRoot = (event) => event.stopPropagation();
	for (const type of blockedEvents) { root.addEventListener(type, stopAtRoot); window.addEventListener(type, blockGameEvents, { capture: true }); }
	const observer = new ResizeObserver(drawLines); observer.observe(figure);
	const tick = (now) => {
		if (destroyed) return;
		const seconds = last ? (now - last) / 1000 : 0; last = now;
		try { pads = Array.from(readGamepads()).filter(Boolean).filter((p) => p.connected); pollFailed = false; }
		catch { pads = []; pollFailed = true; }
		const key = (pollFailed ? 'blocked|' : 'ready|') + pads.map((p) => p.index + ':' + p.id).join('|');
		if (key !== devicesKey) {
			devicesKey = key; device.replaceChildren();
			if (!pads.length) device.append(element('option', 'Aucune manette détectée', { value: '' }));
			for (const pad of pads) device.append(element('option', pad.id, { value: String(pad.index) }));
			if (!pads.some((p) => p.index === selectedIndex && p.id === identity)) { selectedIndex = pads[0]?.index ?? null; loadDevice(pads[0]); }
			device.value = selectedIndex === null ? '' : String(selectedIndex);
			message(pollFailed ? 'Manettes indisponibles dans ce navigateur. Essaie Chrome ou Edge sur localhost.' : pads.length ? 'Manette connectée · ' + MODES[profile.mode] : 'Aucune manette détectée · Tu peux déjà explorer les commandes.');
		}
		const pad = pads.find((p) => p.index === selectedIndex);
		if (learning && pad) {
			const binding = learnBinding(pad, learning.baseline);
			if (binding) {
				const id = learning.id;
				setProfile({ ...profile, sets: { ...profile.sets, [profile.mode]: { ...profile.sets[profile.mode], [id]: binding } } });
				message('Touche modifiée et enregistrée. Relâche les commandes pour reprendre.', true);
			} else if (now > learning.until) { learning = null; message('Aucune commande reçue. Clique de nouveau sur « Changer cette touche ».', true); renderInspector(); }
		}
		const active = !!pad && profile.enabled && !modalOpen() && !learning && !document.hidden && document.hasFocus();
		if (!active) { release(); suspended = true; }
		else { if (suspended && isNeutral(pad, profile)) suspended = false; state = suspended ? mapper.reset() : mapper.sample(pad, profile, seconds); writeInput(state); }
		if ((mount || modalOpen()) && now - lastDisplay > 100) {
			lastDisplay = now;
			for (const control of CONTROLS) {
				const pressed = !!pad && control.actions[profile.mode].some((id) => bindingValue(pad, profile.sets[profile.mode][id], profile.deadzone) > 0.12);
				points.get(control.id).classList.toggle('is-pressed', pressed); labels.get(control.id)?.classList.toggle('is-pressed', pressed);
			}
			if (advanced.open) live.textContent = pad ? 'Diagnostic : ' + pad.buttons.flatMap((b, i) => b.pressed ? ['bouton ' + i] : []).join(', ') + ' · axes ' + pad.axes.map((v) => v.toFixed(2)).join(' / ') : 'Le navigateur n’a pas encore détecté de manette.';
		}
		requestAnimationFrame(tick);
	};
	refresh(); requestAnimationFrame(tick);
	return {
		open, isEditing: () => modalOpen() || !!learning,
		bindInput(write, clear = () => {}) { writeInput = write; clearPhysical = clear; writeInput(state); },
		getProfile: () => structuredClone(profile), getState: () => state,
		destroy() {
			destroyed = true; pause(); observer.disconnect(); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', pause);
			for (const type of blockedEvents) window.removeEventListener(type, blockGameEvents, { capture: true });
			root.remove(); launch.remove(); style.remove();
		},
	};
}
