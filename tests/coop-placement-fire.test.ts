import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/World.ts';
import { levels } from '../src/game/LevelManager.ts';
for (const count of [2, 3, 4] as const) test(`${count} players have separated safe firing lanes in every campaign mission`, () => {
  for (const level of levels) {
    const world = new World(level, count), scale = 1 + (count - 1) * .2;
    for (const [i, player] of world.players.entries()) {
      for (const teammate of world.players.slice(i + 1)) {
        assert.ok(Math.hypot(player.x - teammate.x, player.y - teammate.y) >= 180 * scale, `mission ${level.id}: P${i + 1} too close`);
        assert.ok(Math.abs(player.y - teammate.y) >= 60 * scale, `mission ${level.id}: shared starting firing lane`);
      }
      assert.ok(world.enemies.every(enemy => Math.hypot(player.x - enemy.x, player.y - enemy.y) >= 190 * scale), `mission ${level.id}: hostile deployment too close`);
    }
    const controls = world.players.map(p => ({ move: { x: 0, y: 0 }, aim: { x: p.x + 10000, y: p.y }, fire: true }));
    for (let frame = 0; frame < 10; frame++) world.update(.05, controls[0], false, controls.slice(1));
    assert.equal(world.alivePlayers.length, count, `mission ${level.id}: a starting shot killed a player`);
  }
});
test('holding fire produces evenly spaced shots past six missiles with no magazine pause', () => {
  const world = new World({ ...levels[0], obstacles: [], holes: [], arena: { x: 48, y: 44, w: 5000, h: 1000 }, enemies: [] });
  const player = world.player, times: number[] = [];
  for (let frame = 0; frame < 400; frame++) {
    world.update(.01, { move: { x: 0, y: 0 }, aim: { x: 4500, y: player.y }, fire: true }, false);
    if (world.events.some(e => e.type === 'shot')) times.push(world.elapsed);
    world.events.length = 0;
  }
  assert.equal(times.length, 7);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= .649 && times[i] - times[i - 1] <= .661);
  assert.equal(world.projectiles.length, 7, 'the seventh active missile must be allowed');
});
