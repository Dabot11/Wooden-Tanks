import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demo, levels } from '../src/game/LevelManager.ts';
import { World } from '../src/game/World.ts';
import { findPath, bankAngle, chooseCover, EnemyAI } from '../src/game/EnemyAI.ts';
import { lineClear, circleBox } from '../src/game/CollisionManager.ts';
import type { Projectile } from '../src/game/types.ts';
for (const level of [...levels, demo]) {
  test(`mission ${level.id}: every spawn is clear and enemies have a path to the player`, () => {
    const world = new World(level);
    for (const tank of world.tanks) assert.ok(world.canStand(tank, tank.radius, tank.id), `${tank.kind} ${tank.id} is blocked`);
    for (const enemy of world.enemies) {
      const path = findPath(enemy, world.player, world.solids);
      assert.ok(path.length > 0, `${enemy.kind} cannot reach the player`);
      for (const point of path) assert.ok(world.solids.every(b => !circleBox(point, 21, b)));
    }
  });
}
test('navigation detours around a wall instead of moving through it', () => {
  const boxes = [{ x: 480, y: 180, w: 44, h: 320 }];
  const start = { x: 300, y: 350 }, goal = { x: 750, y: 350 };
  const path = findPath(start, goal, boxes);
  assert.ok(path.some(p => p.y < 158 || p.y > 522));
  let previous = start;
  for (const p of path) { assert.ok(lineClear(previous, p, boxes, 20)); previous = p; }
});
test('a tactical bank shot actually reaches a target behind direct cover', () => {
  const world = new World({ id: 1, name: '', subtitle: '', difficulty: 1, player: { x: 150, y: 150 }, enemies: [{ x: 250, y: 300, kind: 'basic' }], obstacles: [{ x: 190, y: 200, w: 30, h: 40 }] });
  assert.equal(lineClear(world.player, world.enemies[0], world.solids), false);
  const angle = bankAngle(world.player, world.enemies[0], world.solids);
  assert.notEqual(angle, null);
  world.player.turret = angle!; assert.ok(world.fire(world.player));
  for (let i = 0; i < 300 && world.enemies.length; i++) world.update(1 / 120, { move: { x: 0, y: 0 }, aim: { x: 150 + Math.cos(angle!) * 100, y: 150 + Math.sin(angle!) * 100 }, fire: false }, false);
  assert.equal(world.enemies.length, 0);
});
test('enemy AI moves and never enters solid geometry over sustained simulation', () => {
  const world = new World(demo); world.ai = new EnemyAI(() => 0.65);
  const positions = world.enemies.map(t => ({ x: t.x, y: t.y }));
  for (let i = 0; i < 1500; i++) {
    // Isolate navigation from combat outcomes, leaving real AI decisions enabled.
    for (const enemy of world.enemies) enemy.cooldown = 100;
    world.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: 388, y: 100 }, fire: false });
    for (const enemy of world.enemies) assert.ok(!world.solids.some(b => circleBox(enemy, enemy.radius, b)));
  }
  assert.ok(world.enemies.some((t, i) => Math.hypot(t.x - positions[i].x, t.y - positions[i].y) > 40));
});
test('tactical enemies enter Evade when a shell threatens their position', () => {
  const world = new World({ ...levels[0], obstacles: [], enemies: [{ x: 700, y: 300, kind: 'tactical' }] });
  const tank = world.enemies[0]; tank.think = 0;
  const projectile: Projectile = { id: 10, owner: 0, x: 590, y: 300, vx: 430, vy: 0, age: 0.4, bounces: 0, alive: true };
  world.projectiles.push(projectile); world.ai = new EnemyAI(() => 0.1);
  world.ai.update(world, tank, 1 / 60); assert.equal(tank.state, 'Evade');
});

test('cover selection returns a free position protected from direct fire', () => {
  const boxes = [{ x: 600, y: 240, w: 44, h: 140 }];
  const cover = chooseCover({ x: 750, y: 400 }, { x: 250, y: 300 }, boxes);
  assert.ok(cover);
  assert.equal(lineClear(cover!, { x: 250, y: 300 }, boxes), false);
  assert.ok(!boxes.some(box => circleBox(cover!, 22, box)));
});

test('patrol reaches successive waypoints without oscillating around them', () => {
  const world = new World({ ...levels[0], obstacles: [], enemies: [{ x: 1000, y: 160, kind: 'patrol' }] });
  world.ai = new EnemyAI(() => 0.6);
  const tank = world.enemies[0]; tank.goal = { x: 600, y: 360 }; tank.think = 0;
  for (let i = 0; i < 500; i++) {
    tank.cooldown = 100;
    world.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: 180, y: 100 }, fire: false });
  }
  assert.notDeepEqual(tank.goal, { x: 600, y: 360 }, 'must choose another goal after arriving');
});

test('patrol replaces a destination inside an obstacle when its reachable path ends', () => {
  const world = new World({ ...levels[0], obstacles: [{ x: 600, y: 240, w: 88, h: 140 }], enemies: [{ x: 750, y: 400, kind: 'patrol' }] });
  world.ai = new EnemyAI(() => 0.1);
  const tank = world.enemies[0]; tank.goal = { x: 644, y: 310 }; tank.path = []; tank.pathTime = 0; tank.think = 0;
  world.ai.update(world, tank, 1 / 60);
  assert.notDeepEqual(tank.goal, { x: 644, y: 310 });
});
