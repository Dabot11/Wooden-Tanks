import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { levels, duoLevels, cooperativeLevels, getLevel, templateCampaignVariants } from '../src/game/LevelManager.ts';
import { World } from '../src/game/World.ts';
import { auditDuo } from '../src/game/DuoAudit.ts';
import { auditCork, canHitFrom } from '../src/game/SoloAudit.ts';
import { lineClear } from '../src/game/CollisionManager.ts';

for(const level of duoLevels)test(`duo ${level.id}: two safe deployments, assigned routes, rally and reachable defenses`,()=>{
  const audit=auditDuo(level,true),w=new World(level,2);
  assert.deepEqual(audit.issues,[],`${level.name}: ${audit.issues.join('; ')}`);
  assert.equal(w.level,level,'authored arena and formations must not be scaled a second time');
  assert.deepEqual(w.players.map(p=>({x:p.x,y:p.y})),level.playerSpawns);
  assert.deepEqual(w.enemies.map(e=>({x:e.x,y:e.y,kind:e.kind})),level.enemies,'no automatic reinforcements in authored formations');
  assert.ok(audit.separation>=216);
  assert.ok(Math.abs(w.players[0].y-w.players[1].y)>=72,'distinct firing lanes');
  for(const p of audit.players){assert.ok(p.nearestEnemy>=295);assert.ok(p.directThreats<=2);assert.ok(p.escapeDirections>=4);}
  assert.ok(audit.idle>=(level.id<=8?3:2.2),'three seeded live AI runs permit an initial reaction');
  assert.deepEqual(audit.routes.map(r=>r.player),[1,2]);
  assert.ok(Math.hypot(audit.routes[0].path.at(-1)!.x-audit.routes[1].path.at(-1)!.x,audit.routes[0].path.at(-1)!.y-audit.routes[1].path.at(-1)!.y)>100);
  const controls=w.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:true}));
  for(let frame=0;frame<10;frame++)w.update(.05,controls[0],false,controls[1]);
  assert.equal(w.alivePlayers.length,2,'simultaneous initial shots must not kill either teammate');
  for(const [index,enemy]of w.enemies.entries())if(enemy.kind==='tactical')
    assert.ok(audit.routes.some(route=>route.path.filter((_,i)=>i%2===0).some(p=>canHitFrom(level,p,index,!lineClear(p,enemy,w.solids,5),2,route.player-1))),`sentinel ${index+1} has a real solution from an assigned route with the teammate present`);
  for(const shot of level.design!.bankTargets??[]){
    const target=new World(level,2).enemies[shot.enemy];
    assert.equal(lineClear(shot.from,target,w.solids,5),false,'the authored bank post genuinely requires a ricochet');
    assert.ok(canHitFrom(level,shot.from,shot.enemy,true,2),'a real bank shot reaches its intended target before expiration');
  }
  for(const gate of auditCork(level,2)){
    assert.ok(Number.isFinite(gate.before)&&Number.isFinite(gate.after)&&gate.before-gate.after>5,'breaking cork creates a usable shortcut');
    const board=new World(level,2),obstacle=board.obstacles[gate.obstacle];Object.assign(board.player,gate.from);
    board.player.turret=Math.atan2(gate.to.y-gate.from.y,gate.to.x-gate.from.x);
    for(let frame=0;frame<360&&obstacle.alive;frame++)board.update(1/120,{move:{x:0,y:0},aim:gate.to,fire:true},false);
    assert.equal(obstacle.alive,false,'the passage can be opened using ordinary continuous fire');
  }
  if(level.bankShotOnly)for(const index of [0,1]){
    const board=new World(level,2),p=board.players[index];p.x=board.arena.x+260;
    for(let frame=0;frame<300;frame++)board.move(p,{x:0,y:1},116.25,.05);
    assert.ok(p.y<Math.min(...board.holes.map(h=>h.y)),'each teammate remains above the gallery pit barrier');
    for(let frame=0;frame<300;frame++)board.move(p,{x:1,y:0},116.25,.05);
    assert.ok(p.x<board.obstacles[0].x,'each teammate remains in the gallery shooting area');
  }
});

test('duo preserves the introductory layouts, legacy comparison data and campaign introductions',()=>{
  assert.equal(duoLevels.length,40);
  assert.equal(createHash('sha256').update(JSON.stringify(templateCampaignVariants[1].slice(0,21))).digest('hex'),'efdaaf4522ab92619e369dc25f08969d3d8c4e23e9a5313e530085a3b3a7ce8a');
  assert.equal(createHash('sha256').update(JSON.stringify(cooperativeLevels)).digest('hex'),'72f8366dceb74a8c58de3266c4b37979596d356b34e2ca4be8bdebbf3b424596');
  for(const [i,l]of duoLevels.entries()){
    assert.equal(getLevel(i,2),l);assert.equal(getLevel(i,1),levels[i]);
    for(const count of [3,4]as const)assert.equal(getLevel(i,count).playerSpawns?.length,count);
    assert.equal(l.id,levels[i].id);assert.equal(l.name,levels[i].name);assert.equal(l.difficulty,levels[i].difficulty);
    assert.equal(l.design!.identity,levels[i].design!.identity);
  }
  assert.ok(duoLevels.slice(0,2).every(l=>l.enemies.every(e=>e.kind==='basic')));
  assert.equal(duoLevels[10].enemies.filter(e=>e.kind==='patrol').length,1);
  assert.ok(duoLevels.slice(0,20).every(l=>l.enemies.every(e=>e.kind!=='tactical')));
  assert.equal(duoLevels[20].enemies.filter(e=>e.kind==='tactical').length,1);
  assert.equal(duoLevels[29].enemies.filter(e=>e.kind==='tactical').length,5);
});

test('authored duet still permits real friendly fire',()=>{
  const w=new World(duoLevels[0],2);w.player.turret=Math.PI/2;assert.ok(w.fire(w.player));
  const idle={move:{x:0,y:0},aim:{x:w.player.x,y:10000},fire:false};
  for(let i=0;i<240&&w.players[1].alive;i++)w.update(1/120,idle,false);
  assert.equal(w.players[1].alive,false);assert.equal(w.player.alive,true);
});

test('published duo atlas contains the actual formation, assigned routes and cork audit for every mission',()=>{
  const html=readFileSync('public/duo-campaign-review.html','utf8');const match=html.match(/const data=(.*?);let index=0;/s);assert.ok(match);
  const reports=JSON.parse(match[1]);assert.equal(reports.length,40);
  for(const [i,r]of reports.entries()){
    assert.deepEqual(r.level,duoLevels[i]);assert.deepEqual(r.solo,levels[i]);assert.deepEqual(r.audit,auditDuo(duoLevels[i],true));
    assert.deepEqual(r.cork,auditCork(duoLevels[i],2));
  }
});
