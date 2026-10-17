import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GamepadController, normalizeAxis, normalizeStick, validateConfig, STANDARD_BUTTONS, selectPad } from '../src/input/GamepadController.ts';
import type { PadSnapshot } from '../src/input/GamepadController.ts';
import { readBrowserPads } from '../src/input/GamepadRuntime.ts';
const pad = (overrides: Partial<PadSnapshot> = {}): PadSnapshot => ({ id: 'Xbox Wireless Controller', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })), ...overrides });
const withButton = (p: PadSnapshot, index: number, value = 1): PadSnapshot => ({ ...p, buttons: p.buttons.map((b, i) => i === index ? { value, pressed: value > 0.5 } : b) });
function ready() { const c = new GamepadController(); c.poll([pad()]); c.poll([pad()]); return c; }

test('axis normalization clamps finite values and rejects missing and malformed axes', () => {
  assert.equal(normalizeAxis(2), 1); assert.equal(normalizeAxis(-2), -1); assert.equal(normalizeAxis(0.3), 0.3);
  for (const value of [undefined, NaN, Infinity, -Infinity]) assert.equal(normalizeAxis(value), 0);
});
test('radial deadzone suppresses drift in all directions and includes its boundary', () => {
  for (const [x, y] of [[0.05, 0.05], [0.18, 0], [-0.1, -0.1], [0, 0.18]]) assert.deepEqual(normalizeStick(x, y, 0.18), { x: 0, y: 0 });
});
test('stick magnitude is remapped continuously outside the deadzone', () => {
  const value = normalizeStick(0.6, 0, 0.2); assert.ok(Math.abs(value.x - 0.5) < 1e-9); assert.equal(value.y, 0);
  const edge = normalizeStick(0.200001, 0, 0.2); assert.ok(edge.x > 0 && edge.x < 0.000002);
});
test('normalization preserves 360-degree bearing and caps diagonals at unit length', () => {
  const v = normalizeStick(-1, 1, 0.2); assert.ok(Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-9); assert.ok(v.x < 0 && v.y > 0);
  const a = normalizeStick(0.42, -0.7, 0.18); assert.ok(Math.abs(Math.atan2(a.y, a.x) - Math.atan2(-0.7, 0.42)) < 1e-9);
});
test('independent configurable deadzones validate malformed saved values', () => {
  assert.deepEqual(validateConfig({ leftDeadzone: -10, rightDeadzone: 1 }), { leftDeadzone: 0.05, rightDeadzone: 0.45 });
  assert.deepEqual(validateConfig({ leftDeadzone: NaN, rightDeadzone: Infinity }), { leftDeadzone: 0.18, rightDeadzone: 0.2 });
  const c = new GamepadController({ leftDeadzone: 0.4, rightDeadzone: 0.1 }); c.poll([pad()]);
  const frame = c.poll([pad({ axes: [0.3, 0, 0.3, 0] })]); assert.equal(frame.move.x, 0); assert.ok(frame.aim.x > 0);
});
test('Xbox standard assignments are A, B, RT and Menu, not LT or View', () => {
  assert.equal(STANDARD_BUTTONS.confirm, 0); assert.equal(STANDARD_BUTTONS.cancel, 1); assert.equal(STANDARD_BUTTONS.fire, 7); assert.equal(STANDARD_BUTTONS.pause, 9);
  const c = ready(); const frame = c.poll([withButton(withButton(pad(), 6), 8)]); assert.equal(frame.fire, false); assert.equal(frame.pause, false);
});
test('detects sparse gamepad arrays, keeps the selected pad, and ignores disconnected objects', () => {
  const c = ready(); const other = pad({ index: 3, id: 'other' });
  assert.equal(selectPad([null, other, pad()], c.frame)?.index, 0);
  assert.equal(c.poll([null, null, other]).index, 3);
  assert.equal(c.poll([pad({ connected: false }), null]).connected, false);
});
test('unknown mappings and incomplete standard layouts never issue commands', () => {
  for (const p of [pad({ mapping: '' }), pad({ axes: [1, 1] }), pad({ buttons: [] })]) {
    const c = ready(), f = c.poll([p]); assert.equal(f.connected, true); assert.equal(f.mapped, false);
    assert.deepEqual(f.move, { x: 0, y: 0 }); assert.equal(f.confirm, false); assert.equal(f.fire, false);
  }
});
test('connecting with sticks or RT held does nothing until all controls are released', () => {
  const c = new GamepadController(); const held = withButton(pad({ axes: [1, 0, 0, 1] }), 7);
  for (let i = 0; i < 5; i++) { const f = c.poll([held]); assert.equal(f.fire, false); assert.equal(f.mode, 'keyboard-mouse'); assert.deepEqual(f.move, { x: 0, y: 0 }); }
  c.poll([pad()]); const f = c.poll([held]); assert.equal(f.fire, true); assert.equal(f.move.x, 1);
});
test('connecting with A held does not accidentally launch or confirm a menu', () => {
  const c = new GamepadController(), held = withButton(pad(), 0);
  assert.equal(c.poll([held]).confirm, false); assert.equal(c.poll([held]).confirm, false);
  c.poll([pad()]); assert.equal(c.poll([held]).confirm, true);
});
test('A, B and Menu are rising-edge actions and do not repeat while held', () => {
  for (const key of ['confirm', 'cancel', 'pause'] as const) {
    const c = ready(), p = withButton(pad(), STANDARD_BUTTONS[key]);
    assert.equal(c.poll([p])[key], true);
    for (let i = 0; i < 10; i++) assert.equal(c.poll([p])[key], false);
    c.poll([pad()]); assert.equal(c.poll([p])[key], true);
  }
});
test('RT holds fire and uses hysteresis without firing on a resting trigger', () => {
  const c = ready(); assert.equal(c.poll([withButton(pad(), 7, 0.5)]).fire, false);
  assert.equal(c.poll([withButton(pad(), 7, 0.6)]).fire, true);
  for (const value of [0.51, 0.49, 0.4]) assert.equal(c.poll([withButton(pad(), 7, value)]).fire, true);
  assert.equal(c.poll([withButton(pad(), 7, 0.3)]).fire, false);
  assert.equal(c.poll([withButton(pad(), 7, 0.5)]).fire, false);
});
test('sticks and D-pad produce one menu action per deflection or press', () => {
  const c = ready(), down = pad({ axes: [0, 1, 0, 0] });
  assert.equal(c.poll([down]).navigation.y, 1); assert.equal(c.poll([down]).navigation.y, 0);
  c.poll([pad()]); assert.equal(c.poll([down]).navigation.y, 1);
  c.poll([pad()]); const dpad = withButton(pad(), 14); assert.equal(c.poll([dpad]).navigation.x, -1); assert.equal(c.poll([dpad]).navigation.x, 0);
});
test('changing UI context suppresses movement, trigger and buttons until neutral', () => {
  const c = ready(), held = withButton(pad({ axes: [0.8, 0, 0, 1] }), 7);
  c.poll([held]); c.suppress(); assert.equal(c.frame.fire, false);
  const f = c.poll([held]); assert.equal(f.fire, false); assert.equal(f.move.x, 0);
  c.poll([pad()]); assert.equal(c.poll([held]).fire, true);
});
test('real keyboard/mouse input takes over; a held stick and its release cannot steal it back', () => {
  const c = ready(), held = pad({ axes: [1, 0, 0, 0] }); assert.equal(c.poll([held]).mode, 'gamepad');
  c.keyboardMouse(); assert.equal(c.poll([held]).mode, 'keyboard-mouse');
  assert.equal(c.poll([pad()]).mode, 'keyboard-mouse');
  assert.equal(c.poll([pad({ axes: [0, -1, 0, 0] })]).mode, 'gamepad');
});
test('small intentional changes accumulate until the controller can take over again', () => {
  const c = ready(); c.poll([pad({ axes: [0, 0, 1, 0] })]); c.keyboardMouse();
  for (let i = 1; i < 10; i++) c.poll([pad({ axes: [0, 0, Math.cos(i * 0.02), Math.sin(i * 0.02)] })]);
  assert.equal(c.frame.mode, 'gamepad');
});
test('disconnect clears live commands and reconnect requires release again', () => {
  const c = ready(), held = withButton(pad({ axes: [1, 0, 0, 1] }), 7); c.poll([held]);
  const f = c.poll([]); assert.equal(f.connected, false); assert.equal(f.fire, false); assert.equal(f.mode, 'keyboard-mouse');
  assert.equal(c.poll([held]).fire, false); c.poll([pad()]); assert.equal(c.poll([held]).fire, true);
});
test('browser adapter safely tolerates missing Gamepad API and permission errors', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true }); assert.deepEqual(readBrowserPads(), []);
    Object.defineProperty(globalThis, 'navigator', { value: { getGamepads() { throw new Error('SecurityError'); } }, configurable: true }); assert.deepEqual(readBrowserPads(), []);
    Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [null, pad({ index: 1 })] }, configurable: true }); assert.equal(readBrowserPads()[1]?.index, 1);
  } finally { if (original) Object.defineProperty(globalThis, 'navigator', original); else Reflect.deleteProperty(globalThis, 'navigator'); }
});

test('a fresh deflection takes over immediately beyond the configured deadzone', () => {
  const c = ready();
  assert.equal(c.poll([pad({ axes: [0.17, 0, 0, 0] })]).mode, 'keyboard-mouse');
  assert.equal(c.poll([pad({ axes: [0.19, 0, 0, 0] })]).mode, 'gamepad');
  c.poll([pad()]); c.keyboardMouse();
  assert.equal(c.poll([pad({ axes: [0, 0, 0.201, 0] })]).mode, 'gamepad');
});

test('battle transition accepts held sticks immediately without leaking menu confirmation or held RT', () => {
  const c = ready();
  const held = withButton(withButton(pad({ axes: [0.8, 0, 0, 1] }), 0), 7);
  c.poll([held]); c.suppress(); c.poll([held]);
  c.prepareBattle();
  const first = c.poll([held]);
  assert.ok(first.move.x > 0); assert.equal(first.aim.y, 1);
  assert.equal(first.confirm, false); assert.equal(first.fire, false);
  c.poll([withButton(pad({ axes: [0.8, 0, 0, 1] }), 0)]);
  assert.equal(c.poll([held]).fire, true, 'RT works after release while sticks stay held');
});

test('fresh RT and pause presses work on the first poll after a battle transition', () => {
  const c = ready(); c.suppress(); c.prepareBattle();
  const first = c.poll([withButton(withButton(pad({ axes: [1, 0, 0, 1] }), 7), 9)]);
  assert.equal(first.move.x, 1); assert.equal(first.fire, true); assert.equal(first.pause, true);
});
