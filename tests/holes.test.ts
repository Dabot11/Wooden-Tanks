import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.ts';
import { findPath } from '../src/game/EnemyAI.ts';
import { circleCircle, lineClear, sweepCircle } from '../src/game/CollisionManager.ts';
import { demo } from './fixtures/reference-level.ts';
import { levels } from '../src/game/LevelManager.ts';
import type { Level, Projectile, TankKind } from '../src/game/types.ts';
const hole = { x: 300, y: 300, radius: 15 };
const level: Level = { id: 1, name: 'Holes', subtitle: '', difficulty: 1, player: { x: 100, y: 500 }, enemies: [{ x: 500, y: 100, kind: 'basic' }], obstacles: [], holes: [hole] };

test('every displayed board hole participates in movement collision in all missions', () => {
  for (const mission of [...levels, demo]) {
    const world = new World(mission);
    assert.deepEqual(world.holes, mission.holes ?? []);
    for (const pit of world.holes) assert.equal(world.canStand(pit, world.player.radius, world.player.id), false);
  }
});
test('player and every enemy type stop at the pit rim from all four sides', () => {
  for (const kind of ['player', 'basic', 'patrol', 'tactical'] as TankKind[]) {
    for (const dir of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
      const world = new World(level); const tank = kind === 'player' ? world.player : world.enemies[0]; tank.kind = kind;
      tank.x = hole.x + dir.x * 80; tank.y = hole.y + dir.y * 80;
      for (let i = 0; i < 100; i++) {
        world.move(tank, { x: -dir.x, y: -dir.y }, 155, 1 / 60);
        assert.equal(circleCircle(tank, tank.radius, hole, hole.radius), false);
      }
      assert.ok(Math.hypot(tank.x - hole.x, tank.y - hole.y) < 38, `${kind} did not approach the rim`);
      assert.ok(tank.alive);
    }
  }
});
test('pit collision is circular and includes the full tank radius', () => {
  const world = new World(level);
  assert.equal(world.canStand({ x: 330, y: 300 }, 19), false);
  assert.equal(world.canStand({ x: 334, y: 300 }, 19), true);
  assert.equal(world.canStand({ x: 323, y: 323 }, 19), false);
  assert.equal(world.canStand({ x: 326, y: 326 }, 19), true);
});
test('enemy navigation routes around a pit with clearance for its tank', () => {
  const world = new World(level), start = { x: 150, y: 300 }, goal = { x: 450, y: 300 };
  const path = findPath(start, goal, world.movementSolids);
  assert.ok(path.length); assert.ok(path.some(p => Math.abs(p.y - hole.y) > hole.radius + 20));
  let previous = start;
  for (const point of path) {
    assert.equal(sweepCircle(previous, { x: point.x - previous.x, y: point.y - previous.y }, hole, hole.radius + 20), null);
    previous = point;
  }
});
test('bullets fly over pits without bouncing and keep a clear firing line', () => {
  const world = new World(level);
  assert.ok(lineClear({ x: 250, y: 300 }, { x: 350, y: 300 }, world.solids));
  const shell: Projectile = { id: 99, owner: 0, x: 250, y: 300, vx: 430, vy: 0, age: 0, bounces: 0, alive: true };
  world.stepProjectile(shell, 0.2);
  assert.ok(shell.alive); assert.equal(shell.bounces, 0); assert.equal(shell.x, 336);
  assert.deepEqual(world.holes, [hole]); assert.equal(world.events.length, 0);
});
