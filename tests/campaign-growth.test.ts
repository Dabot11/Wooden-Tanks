import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/game/LevelManager.ts';
import { registerCampaign, lateCampaignDifficulty, enemyReloadScale } from '../src/game/Campaign.ts';
import { World } from '../src/game/World.ts';
import { EnemyAI } from '../src/game/EnemyAI.ts';

test('campaign registration supports more than 100 authored missions and rejects gaps and backwards difficulty', () => {
  const future = Array.from({ length: 120 }, (_, i) => ({ ...levels[0], id: i + 1, difficulty: 1 + i * 0.05 }));
  assert.equal(registerCampaign([future.slice(0, 40), future.slice(40)]).length, 120);
  assert.throws(() => registerCampaign([[future[0], future[2]]]));
  assert.throws(() => registerCampaign([[future[0], { ...future[1], difficulty: 0.5 }]]));
});
test('missions 31–40 increase reload pressure and never reduce the weighted opposing force', () => {
  assert.equal(levels.length, 40);
  const weight = (i: number) => levels[i].enemies.reduce((sum, enemy) => sum + ({ basic: 1, patrol: 2, tactical: 3 }[enemy.kind]), 0);
  for (let i = 30; i < 40; i++) {
    assert.ok(levels[i].difficulty > levels[i - 1].difficulty);
    assert.ok(weight(i) >= weight(i - 1));
    assert.ok(enemyReloadScale(levels[i].difficulty) > enemyReloadScale(levels[i - 1].difficulty));
  }
  for (const id of [50, 100, 120, 1000]) {
    const scale = enemyReloadScale(lateCampaignDifficulty(id));
    assert.ok(scale > enemyReloadScale(levels[39].difficulty));
    assert.ok(scale <= 1.65, 'late-game pressure cannot create an impossible unlimited firing rate');
  }
});
test('late difficulty affects actual raider reloads without changing projectile speed', () => {
  const reload = (id: number) => {
    const w = new World({ ...levels[0], obstacles: [], holes: [], difficulty: lateCampaignDifficulty(id), player: { x: 180, y: 300 }, enemies: [{ x: 650, y: 300, kind: 'patrol' }] });
    w.ai = new EnemyAI(() => 0.5); const tank = w.enemies[0]; tank.turret = Math.PI; tank.cooldown = 0; tank.think = 0;
    for (let n = 0; n < 80 && !tank.shots; n++) w.ai.update(w, tank, 0.05);
    assert.equal(tank.shots, 1);
    assert.equal(Math.hypot(w.projectiles[0].vx, w.projectiles[0].vy), 322.5);
    return tank.cooldown;
  };
  assert.ok(reload(40) < reload(30)); assert.ok(reload(100) < reload(40));
});
