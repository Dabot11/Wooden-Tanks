import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { levels, cooperativeLevels, getLevel } from '../src/game/LevelManager.ts';
import { auditSolo, auditCork, canHitFrom } from '../src/game/SoloAudit.ts';
import { World } from '../src/game/World.ts';
import { EnemyAI } from '../src/game/EnemyAI.ts';
import { lineClear } from '../src/game/CollisionManager.ts';

for (const level of levels) test(`solo ${level.id}: authored routes, safe deployment, useful cork and reachable defenses`, () => {
  const audit=auditSolo(level),world=new World(level);
  assert.deepEqual(audit.issues,[],`${level.name}: ${audit.issues.join('; ')}`);
  assert.ok(audit.routes.length>=2);
  assert.ok(audit.nearestEnemy>=295,'initial enemies leave reaction distance');
  assert.ok(audit.directThreats<=2,'initial cover limits simultaneous direct firing lines');
  assert.ok(audit.escapeDirections>=4,'player has room to dodge from deployment');
  const ends=audit.routes.map(r=>r.path.at(-1)!);
  assert.ok(Math.hypot(ends[0].x-ends[1].x,ends[0].y-ends[1].y)>100,'the two routes serve distinct sectors');
  for (const gate of auditCork(level)) {
    assert.ok(Number.isFinite(gate.before)&&Number.isFinite(gate.after));
    assert.ok(gate.before-gate.after>5,`cork ${gate.obstacle}: destruction must open a useful passage`);
    const w=new World(level),o=w.obstacles[gate.obstacle];
    Object.assign(w.player,gate.from);
    const angle=Math.atan2(gate.to.y-gate.from.y,gate.to.x-gate.from.x);
    w.player.turret=angle;
    for(let frame=0;frame<360&&o.alive;frame++) w.update(1/120,{move:{x:0,y:0},aim:gate.to,fire:true},false);
    assert.equal(o.alive,false,`cork ${o.id} must be breakable with real shots`);
  }
  const candidates=[level.player,...audit.routes.flatMap(r=>r.path.filter((_,i)=>i%2===0))];
  for (const [index,enemy] of world.enemies.entries()) if(enemy.kind==='tactical')
    assert.ok(candidates.some(p=>canHitFrom(level,p,index,!lineClear(p,enemy,world.solids,5))),`sentinel ${index+1}: reachable post must have a real missile solution`);
  for(const shot of level.design!.bankTargets??[]) {
    assert.equal(lineClear(shot.from,world.enemies[shot.enemy],world.solids,5),false,'bank lesson actually needs a ricochet');
    assert.ok(canHitFrom(level,shot.from,shot.enemy,true),'bank shot reaches the intended target before expiration, with other tanks present');
  }
});

test('all 40 solo deployments allow reaction time against seeded live AI',()=>{
  for(const level of levels) for(const seed of [1,7,19]) {
    let state=seed;const w=new World(level);
    w.ai=new EnemyAI(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
    const grace=level.id<=8?3:2.2;
    while(w.player.alive&&w.elapsed<grace)w.update(1/30,{move:{x:0,y:0},aim:{x:w.player.x,y:w.player.y-100},fire:false});
    assert.ok(w.player.alive,`mission ${level.id}, seed ${seed}: unavoidable early deployment pressure`);
  }
});
test('solo revisions preserve mission identity and exact existing cooperative data',()=>{
  assert.equal(levels.length,40);
  assert.equal(createHash('sha256').update(JSON.stringify(cooperativeLevels)).digest('hex'),'72f8366dceb74a8c58de3266c4b37979596d356b34e2ca4be8bdebbf3b424596');
  for(const level of levels) {
    assert.equal(getLevel(level.id-1),level);
    for(const count of [3,4] as const) {
      if(level.id<21)assert.equal(getLevel(level.id-1,count),cooperativeLevels[level.id-1]);
      assert.equal(getLevel(level.id-1,count).name,level.name);
    }
  }
  assert.deepEqual(new Set(levels.slice(0,2).flatMap(l=>l.enemies.map(e=>e.kind))),new Set(['basic']));
  assert.ok(levels.slice(0,6).every(l=>l.enemies.every(e=>e.kind!=='tactical')));
  assert.equal(levels[6].enemies.filter(e=>e.kind==='tactical').length,1);
});

test('published review data matches the playable solo catalog and preserved baseline', async()=>{
  const {readFileSync}=await import('node:fs');
  const html=readFileSync('public/solo-campaign-review.html','utf8');
  const match=html.match(/const data=(.*?);let index=0;/s);
  assert.ok(match,'interactive report contains its review data');
  const reports=JSON.parse(match[1]);
  assert.equal(reports.length,levels.length);
  for(const [index,report]of reports.entries()) {
    assert.deepEqual(report.level,levels[index],`mission ${index+1}: regenerate the report with npm run review:solo`);
    assert.deepEqual(report.before,cooperativeLevels[index]);
    assert.equal(report.audit.issues.length,0);
    assert.deepEqual(report.cork,auditCork(levels[index]));
  }
});
