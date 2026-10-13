import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.ts';
import { levels, getLevel } from '../src/game/LevelManager.ts';
import { GamepadTeam } from '../src/input/GamepadTeam.ts';
import type { PadSnapshot } from '../src/input/GamepadController.ts';
import { EnemyAI, findPath, bankAngle } from '../src/game/EnemyAI.ts';
import type { Level, PlayerCount } from '../src/game/types.ts';
const idle = { move: { x: 0, y: 0 }, aim: { x: 100, y: 0 }, fire: false };
const fixture: Level = { id: 1, name: '', subtitle: '', difficulty: 1, obstacles: [], holes: [], player: { x: 150, y: 300 }, enemies: [{ x: 650, y: 300, kind: 'tactical' }] };
const pad = (index: number): PadSnapshot => ({ index, id: 'Xbox Series Controller', mapping: 'standard', connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
for (const count of [1, 2, 3, 4] as const) test(`${count} players: all published missions have free spawns, expanded bounds and proportional forces`, () => {
  for (const soloLevel of levels) {
    const level = getLevel(soloLevel.id - 1, count);
    const original = structuredClone(level);
    const w = new World(level, count);
    assert.equal(w.players.length, count); assert.equal(w.enemies.length, level.enemies.length * count);
    assert.ok(w.arena.w >= 1184 * (1 + (count - 1) * 0.2));
    for (const tank of w.tanks) {
      assert.ok(w.canStand(tank, tank.radius, tank.id), `mission ${level.id}, tank ${tank.id}`);
      assert.ok(tank.x >= w.arena.x + tank.radius && tank.x <= w.arena.x + w.arena.w - tank.radius);
      assert.ok(tank.y >= w.arena.y + tank.radius && tank.y <= w.arena.y + w.arena.h - tank.radius);
    }
    for (const enemy of w.enemies) {
      const path = findPath(enemy, w.player, w.movementSolids, 20, w.arena);
      if (level.bankShotOnly) {
        assert.equal(path.length, 0);
        assert.notEqual(bankAngle(w.player, enemy, w.solids, Math.hypot(w.arena.w, w.arena.h) * 1.5), null, 'a bank shot can reach every protected sentinel');
      } else assert.ok(path.length, `mission ${level.id}: enemy ${enemy.id} has an approach route`);
    }
    for (const p of w.players.slice(1)) assert.ok(findPath(w.player, p, w.movementSolids, 20, w.arena).length);
    assert.deepEqual(level, original, 'scaling never mutates saved mission data');
  }
});
test('the campaign introduces only gray scouts, striped raiders and stationary sentinels progressively', () => {
  assert.ok(levels.slice(0, 2).every(l => l.enemies.every(e => e.kind === 'basic')));
  assert.ok(levels.slice(2, 6).some(l => l.enemies.some(e => e.kind === 'patrol')));
  assert.ok(levels.slice(0, 6).every(l => l.enemies.every(e => e.kind !== 'tactical')));
  assert.ok(levels[6].enemies.some(e => e.kind === 'tactical'));
  assert.deepEqual(new Set(levels.flatMap(l => l.enemies.map(e => e.kind))), new Set(['basic', 'patrol', 'tactical']));
});
for (const count of [3, 4] as PlayerCount[]) for (const layout of ['two-pads', 'keyboard-pad'] as const) test(`${count} players with ${layout}: stable device assignment, reconnect safety and shared pause`, () => {
  const team = new GamepadTeam(), pads = Array.from({ length: count - (layout === 'keyboard-pad' ? 1 : 0) }, (_, i) => pad(i * 2));
  assert.equal(team.startCoop(layout, pads.slice(1), count), false);
  assert.ok(team.startCoop(layout, pads, count)); team.poll(pads);
  const offset = layout === 'keyboard-pad' ? 1 : 0;
  pads.forEach((p, i) => { p.axes = [i % 2 ? -1 : 1, 0, 0, 1]; }); team.poll([...pads].reverse());
  pads.forEach((p, i) => { assert.equal(team.frames[i + offset].index, p.index); assert.equal(team.frames[i + offset].move.x, i % 2 ? -1 : 1); });
  const last = pads.at(-1)!; const remaining = pads.slice(0, -1);
  team.poll([...remaining, pad(19)]); assert.equal(team.ready, false); assert.equal(team.frames[count - 1].connected, false);
  team.poll(pads); assert.equal(team.frames[count - 1].move.x, 0);
  pads.forEach(p => p.axes = [0, 0, 0, 0]); team.poll(pads); assert.equal(team.ready, true);
  last.buttons[9] = { pressed: true, value: 1 }; team.poll(pads); assert.equal(team.pauseRequested, true);
  pads[0].buttons[9] = { pressed: true, value: 1 }; team.poll(pads); assert.equal(team.pauseRequested, false);
});
test('all four tanks accept independent aim/fire and friendly shots kill any teammate', () => {
  const w = new World(fixture, 4);
  w.players.forEach((p, i) => { p.x = 160 + i * 150; p.y = 700; p.turret = -Math.PI / 2; });
  w.update(0.05, { ...idle, aim: { x: 160, y: 0 }, fire: true }, false, w.players.slice(1).map(p => ({ ...idle, aim: { x: p.x, y: 0 }, fire: true })));
  assert.ok(w.players.every(p => p.shots === 1));
  for (let i = 1; i < 4; i++) {
    const target = w.players[i];
    const shot = { id: 999 + i, owner: 0, x: target.x - 30, y: target.y, vx: 322.5, vy: 0, age: 0.5, bounces: i % 2, alive: true };
    w.stepProjectile(shot, 0.05); assert.equal(target.alive, false); assert.equal(shot.alive, false);
  }
  assert.equal(w.alivePlayers.length, 1);
});
for (const kind of ['basic', 'patrol', 'tactical'] as const) test(`${kind}: real missiles respect speed, ammunition and wall bounce profile after owner dies`, () => {
  const w = new World({ ...fixture, enemies: [{ x: 650, y: 300, kind }] }), tank = w.enemies[0];
  tank.cooldown = 0; tank.turret = 0; assert.ok(w.fire(tank));
  const p = w.projectiles[0], limit = kind === 'basic' ? 0 : 1;
  assert.equal(Math.hypot(p.vx, p.vy), 322.5 * (kind === 'tactical' ? 1.8 : 1));
  if (kind !== 'patrol') { tank.cooldown = 0; assert.equal(w.fire(tank), false); }
  tank.alive = false;
  for (let impact = 0; impact <= limit; impact++) {
    p.x = w.arena.x + w.arena.w - 5; p.y = 400; p.vx = Math.abs(p.vx); p.vy = 0;
    w.stepProjectile(p, 0.01);
    assert.equal(p.alive, impact < limit);
  }
});
test('a stationary sentinel shoots down an incoming shell, consumes its slow reload, then can be killed by the next shot', () => {
  const w = new World(fixture); w.ai = new EnemyAI(() => 0.5);
  const tank = w.enemies[0]; tank.cooldown = 0; tank.turret = Math.PI;
  const origin = { x: tank.x, y: tank.y };
  w.player.turret = 0; w.fire(w.player);
  for (let i = 0; i < 120 && !w.events.some(e => e.type === 'shellCollision'); i++) w.update(1 / 120, idle);
  assert.ok(w.events.some(e => e.type === 'shellCollision'));
  assert.deepEqual({ x: tank.x, y: tank.y }, origin); assert.ok(tank.alive); assert.ok(tank.cooldown > 2);
  w.player.cooldown = 0; w.player.turret = 0; assert.ok(w.fire(w.player));
  for (let i = 0; i < 240 && tank.alive; i++) w.update(1 / 120, idle);
  assert.equal(tank.alive, false);
});

test('gallery movement remains inside the player zone and real ricochets can kill every protected sentinel', () => {
  const w = new World(levels[15]);
  for (let i = 0; i < 300; i++) w.move(w.player, { x: 0, y: 1 }, 116.25, 0.05);
  assert.ok(w.player.y < 420);
  for (let i = 0; i < 300; i++) w.move(w.player, { x: 1, y: 0 }, 116.25, 0.05);
  assert.ok(w.player.x < 482);
  for (let index = 0; index < levels[15].enemies.length; index++) {
    const board = new World(levels[15]), target = board.enemies[index];
    board.tanks.filter(t => t.kind !== 'player' && t.id !== target.id).forEach(t => t.alive = false);
    const angle = bankAngle(board.player, target, board.solids)!;
    board.player.turret = angle; assert.ok(board.fire(board.player));
    for (let frame = 0; frame < 840 && target.alive; frame++) board.update(1 / 120, idle, false);
    assert.equal(target.alive, false, `sentinel ${index} is vulnerable to a real bank shot`);
    assert.ok(board.events.some(e => e.type === 'bounce'));
  }
});
