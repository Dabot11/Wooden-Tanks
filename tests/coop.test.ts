import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GamepadTeam } from '../src/input/GamepadTeam.ts';
import type { PadSnapshot } from '../src/input/GamepadController.ts';
import { World } from '../src/game/World.ts';
import { EnemyAI, findPath } from '../src/game/EnemyAI.ts';
import { demo } from './fixtures/reference-level.ts';
import { levels } from '../src/game/LevelManager.ts';
import type { Level, Projectile } from '../src/game/types.ts';
const pad = (index: number, overrides: Partial<PadSnapshot> = {}): PadSnapshot => ({
  index, id: 'Xbox Series Controller', connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), ...overrides,
});
const level: Level = { id: 1, name: 'coop', subtitle: '', difficulty: 1, player: { x: 150, y: 400 }, enemies: [{ x: 1000, y: 400, kind: 'offensive' }], obstacles: [] };
const idle = { move: { x: 0, y: 0 }, aim: { x: 150, y: 0 }, fire: false };
const shell = (owner: number, x: number, y: number): Projectile => ({ id: 999, owner, x, y, vx: 430, vy: 0, age: 1, bounces: 0, alive: true });

test('co-op assigns identical Xbox devices to separate slots and keeps the menu controller as P1', () => {
  const team = new GamepadTeam(), first = pad(0), second = pad(3);
  team.poll([null, second]); team.poll([first, null, null, second]);
  assert.ok(team.startCoop('two-pads', [first, null, null, second]));
  assert.equal(team.frame.index, 3); assert.equal(team.secondFrame.index, 0);
  team.poll([first, second]);
  first.axes = [1, 0, 0, -1]; second.axes = [-1, 0, 0, 1];
  team.poll([second, first]);
  assert.equal(team.frame.move.x, -1); assert.equal(team.secondFrame.move.x, 1);
  assert.equal(team.frame.aim.y, 1); assert.equal(team.secondFrame.aim.y, -1);
});
test('a missing controller never steals the surviving controller or a newly connected third device', () => {
  const team = new GamepadTeam(), a = pad(0), b = pad(1), spare = pad(2);
  team.startCoop('two-pads', [a, b]); team.poll([a, b]);
  b.axes = [1, 0, 0, 0]; team.poll([null, b, spare]);
  assert.equal(team.ready, false); assert.equal(team.frame.connected, false);
  assert.equal(team.secondFrame.index, 1); assert.equal(team.secondFrame.move.x, 1);
  a.axes = [-1, 0, 0, 0]; team.poll([a, b, spare]);
  assert.equal(team.ready, true); assert.equal(team.frame.move.x, 0);
  a.axes = [0, 0, 0, 0]; team.poll([a, b]); a.axes = [-1, 0, 0, 0]; team.poll([a, b]);
  assert.equal(team.frame.move.x, -1);
});
test('keyboard plus one pad reserves the controller exclusively for P2', () => {
  const team = new GamepadTeam(), p = pad(2);
  assert.equal(team.startCoop('two-pads', [p]), false);
  assert.ok(team.startCoop('keyboard-pad', [null, null, p])); team.poll([p]);
  p.axes = [1, 0, -1, 0]; team.poll([p]); team.keyboardMouse();
  assert.equal(team.frame.connected, false); assert.equal(team.secondFrame.move.x, 1);
  assert.equal(team.secondFrame.mode, 'gamepad'); assert.equal(team.ready, true);
});
test('both players must release held controls after start, pause and config changes', () => {
  const team = new GamepadTeam(), a = pad(0), b = pad(1);
  a.axes = [1, 0, 0, 0]; b.buttons[7] = { pressed: true, value: 1 };
  team.startCoop('two-pads', [a, b]); team.poll([a, b]);
  assert.equal(team.frame.move.x, 0); assert.equal(team.secondFrame.fire, false);
  a.axes = [0, 0, 0, 0]; b.buttons[7] = { pressed: false, value: 0 }; team.poll([a, b]);
  a.axes = [1, 0, 0, 0]; b.buttons[7] = { pressed: true, value: 1 }; team.poll([a, b]);
  assert.equal(team.frame.move.x, 1); assert.equal(team.secondFrame.fire, true);
  team.suppress(); team.poll([a, b]); assert.equal(team.frame.move.x, 0); assert.equal(team.secondFrame.fire, false);
  team.configure({ leftDeadzone: 0.3 }); assert.equal(team.config.leftDeadzone, 0.3);
  team.endCoop(); team.poll([b]); assert.equal(team.frame.index, 1); assert.equal(team.secondFrame.connected, false);
});
test('unsupported controllers cannot start co-op', () => {
  const team = new GamepadTeam();
  assert.equal(team.startCoop('keyboard-pad', [pad(0, { mapping: '' })]), false);
  assert.equal(team.layout, null);
});
test('both tanks spawn safely with a reachable route in every mission and the regression fixture', () => {
  for (const l of [...levels, demo]) {
    const w = new World(l, 2); assert.equal(w.players.length, 2); assert.equal(w.enemies.length, l.enemies.length);
    const p = w.players[1]; assert.ok(w.canStand(p, p.radius, p.id), `mission ${l.id}`);
    assert.ok(findPath(w.player, p, w.movementSolids).length, `reachable mission ${l.id}`);
  }
});
test('players move, aim and fire independently with identical speed, reload and ammo limits', () => {
  const w = new World(level, 2), p2 = w.players[1]; p2.x = 300;
  w.update(0.05, { ...idle, move: { x: 0, y: -1 }, aim: { x: 1000, y: 394 }, fire: true }, false,
    { move: { x: 0, y: 1 }, aim: { x: 300, y: 1000 }, fire: true });
  assert.ok(w.player.y < 400 && p2.y > 400); assert.ok(Math.abs(w.player.y + p2.y - 800) < 1e-8);
  assert.equal(w.projectiles.length, 2); assert.equal(w.player.cooldown, 0.28); assert.equal(p2.cooldown, 0.28);
  assert.equal(w.events.filter(e => e.type === 'shot' && e.player).length, 2);
  for (const p of w.players) {
    for (let i = 0; i < 4; i++) { p.cooldown = 0; assert.ok(w.fire(p)); }
    p.cooldown = 0; assert.equal(w.fire(p), false);
  }
  assert.equal(w.projectiles.filter(p => p.owner === p2.id).length, 5);
});
test('teammates are immune to allied shells, including rebounds, but enemies still take damage', () => {
  for (const shooter of [0, -1]) {
    const w = new World(level, 2), target = w.players.find(t => t.id !== shooter)!;
    target.x = 500; target.y = 200;
    const p = shell(shooter, 455, 200); p.bounces = 1; w.stepProjectile(p, 0.2);
    assert.equal(target.alive, true); assert.equal(p.alive, true);
    const enemy = w.enemies[0], lethal = shell(shooter, enemy.x - 45, enemy.y);
    w.stepProjectile(lethal, 0.1); assert.equal(enemy.alive, false);
  }
});
test('enemy shells can kill either player and P2 destruction is a player event', () => {
  const w = new World(level, 2), p2 = w.players[1];
  p2.x = 500; p2.y = 200;
  w.stepProjectile(shell(1, 460, 200), 0.1);
  assert.equal(p2.alive, false); assert.equal(w.player.alive, true); assert.equal(w.alivePlayers.length, 1);
  assert.ok(w.events.some(e => e.type === 'destroy' && e.player && e.kind === 'player'));
});
test('enemies target P2 when nearer and keep fighting after P1 is destroyed', () => {
  const w = new World(level, 2), p2 = w.players[1], enemy = w.enemies[0];
  w.ai = new EnemyAI(() => 0.5); p2.x = 700; p2.y = 200; enemy.think = 0;
  w.update(0.05, idle);
  assert.deepEqual({ x: enemy.goal.x, y: enemy.goal.y }, { x: p2.x, y: p2.y });
  w.player.alive = false; const before = enemy.distance;
  for (let i = 0; i < 20; i++) w.update(0.05, idle);
  assert.ok(enemy.distance > before); assert.equal(p2.alive, true);
});
test('dead players cannot move or shoot while the survivor keeps playing', () => {
  const w = new World(level, 2); w.player.alive = false;
  const before = { x: w.player.x, y: w.player.y };
  w.update(0.05, { ...idle, move: { x: 1, y: 0 }, fire: true }, false, { ...idle, move: { x: 1, y: 0 }, fire: true });
  assert.deepEqual({ x: w.player.x, y: w.player.y }, before); assert.equal(w.player.shots, 0);
  assert.equal(w.players[1].shots, 1);
});
test('near-simultaneous Menu presses pause once until both buttons are released', () => {
  const team = new GamepadTeam(), a = pad(0), b = pad(1);
  team.startCoop('two-pads', [a, b]); team.poll([a, b]);
  a.buttons[9] = { pressed: true, value: 1 }; team.poll([a, b]); assert.equal(team.pauseRequested, true);
  team.suppress(); team.poll([a, b]);
  b.buttons[9] = { pressed: true, value: 1 }; team.poll([a, b]); assert.equal(team.pauseRequested, false);
  a.buttons[9] = { pressed: false, value: 0 }; team.poll([a, b]); assert.equal(team.pauseRequested, false);
  b.buttons[9] = { pressed: false, value: 0 }; team.poll([a, b]);
  b.buttons[9] = { pressed: true, value: 1 }; team.poll([a, b]); assert.equal(team.pauseRequested, true);
});
