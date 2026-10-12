import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reflect, sweepBox, sweepCircle } from '../src/game/CollisionManager.ts';
import { World } from '../src/game/World.ts';
import type { Level, Projectile } from '../src/game/types.ts';
const base: Level = { id: 1, name: 'test', subtitle: '', difficulty: 1, player: { x: 150, y: 150 }, enemies: [{ x: 900, y: 500, kind: 'basic' }], obstacles: [{ x: 300, y: 100, w: 44, h: 200 }] };
const input = { move: { x: 0, y: 0 }, aim: { x: 500, y: 150 }, fire: false };
const shot = (overrides: Partial<Projectile> = {}): Projectile => ({ id: 20, owner: 0, x: 250, y: 150, vx: 430, vy: 0, age: 0, bounces: 0, alive: true, ...overrides });
test('reflection preserves speed and reflects the surface normal', () => {
  assert.deepEqual(reflect({ x: 100, y: 50 }, { x: -1, y: 0 }), { x: -100, y: 50 });
  const r = reflect({ x: 80, y: 80 }, { x: -Math.SQRT1_2, y: -Math.SQRT1_2 });
  assert.ok(Math.abs(r.x + 80) < 1e-10 && Math.abs(r.y + 80) < 1e-10);
});
test('swept collision catches thin walls even with long displacement', () => {
  const hit = sweepBox({ x: 0, y: 25 }, { x: 1000, y: 0 }, { x: 100, y: 0, w: 1, h: 50 }, 4)!;
  assert.equal(hit.t, 0.096); assert.deepEqual(hit.normal, { x: -1, y: 0 });
});
test('circle sweep finds earliest tank hit', () => {
  assert.equal(sweepCircle({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 0 }, 10), 0.4);
});
test('player moves in four directions and aims independently', () => {
  for (const move of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
    const world = new World(base); world.update(0.05, { ...input, move }, false);
    assert.ok((world.player.x - 150) * move.x + (world.player.y - 150) * move.y > 0);
    assert.ok(Math.abs(world.player.turret - Math.atan2(input.aim.y - world.player.y, input.aim.x - world.player.x)) < 0.001);
  }
});
test('diagonal movement does not increase speed', () => {
  const a = new World(base), b = new World(base);
  a.update(0.05, { ...input, move: { x: 1, y: 0 } }, false);
  b.update(0.05, { ...input, move: { x: 1, y: 1 } }, false);
  assert.ok(Math.abs(Math.hypot(b.player.x - 150, b.player.y - 150) - (a.player.x - 150)) < 1e-8);
});
test('tank cannot cross a solid wall', () => {
  const world = new World(base);
  for (let i = 0; i < 200; i++) world.update(0.02, { ...input, move: { x: 1, y: 0 } }, false);
  assert.ok(world.player.x <= 281);
});
test('projectile reflects then consumes the remaining frame time', () => {
  const world = new World(base); const p = shot(); world.stepProjectile(p, 0.2);
  assert.equal(p.bounces, 1); assert.equal(p.vx, -430); assert.ok(p.x < 296); assert.ok(p.alive);
});
test('projectile cannot bounce forever or stick at a wall', () => {
  const world = new World(base); const p = shot({ x: 292, bounces: 2 }); world.stepProjectile(p, 0.05);
  assert.equal(p.bounces, 3); assert.equal(p.alive, false);
});
test('direct hit destroys exactly one enemy', () => {
  const world = new World(base); const enemy = world.enemies[0];
  const p = shot({ x: enemy.x - 50, y: enemy.y }); world.stepProjectile(p, 0.2);
  assert.equal(enemy.alive, false); assert.equal(p.alive, false); assert.equal(world.events.filter(e => e.type === 'destroy').length, 1);
});
test('a rebounding shell can destroy its owner', () => {
  const world = new World(base); const p = shot({ x: 190, vx: -430, age: 1, bounces: 1 });
  world.stepProjectile(p, 0.1); assert.equal(world.player.alive, false);
});
test('destructible block takes three impacts and frees the passage', () => {
  const world = new World({ ...base, obstacles: [{ x: 300, y: 100, w: 44, h: 200, destructible: true }] });
  for (let i = 0; i < 3; i++) world.stepProjectile(shot(), 0.2);
  assert.equal(world.obstacles[0].alive, false); assert.equal(world.obstacles[0].hp, 0);
  assert.ok(world.canStand({ x: 320, y: 150 }, 19));
});
test('reload and active projectile limit are enforced', () => {
  const world = new World(base); world.player.turret = Math.PI / 2;
  assert.ok(world.fire(world.player)); assert.equal(world.fire(world.player), false);
  for (let i = 0; i < 4; i++) { world.player.cooldown = 0; assert.ok(world.fire(world.player)); }
  world.player.cooldown = 0; assert.equal(world.fire(world.player), false);
});
test('enemy fires only with an unobstructed direct line of sight', () => {
  const world = new World(base); const enemy = world.enemies[0]; enemy.x = 450; enemy.y = 150; enemy.cooldown = 0;
  world.update(0.05, input); assert.equal(world.projectiles.filter(p => p.owner === enemy.id).length, 0);
});
