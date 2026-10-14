import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getLevel,levels,duoLevels,campaignVariants,templateCampaignVariants} from '../src/game/LevelManager.ts';
import {World} from '../src/game/World.ts';
import {auditParty} from '../src/game/PartyAudit.ts';
import {auditCork,canHitFrom} from '../src/game/SoloAudit.ts';
import {lineClear} from '../src/game/CollisionManager.ts';

for(const count of [3,4]as const)for(let id=1;id<=20;id++)test(`${count} players, early mission ${id}: separated deployment, intended routes and real tactical solutions`,()=>{
  const level=getLevel(id-1,count),w=new World(level,count),a=auditParty(level,count,true);
  assert.deepEqual(a.issues,[],`${id}/${count}: ${a.issues.join('; ')}`);
  assert.equal(w.level,level);assert.deepEqual(w.enemies.map(t=>({x:t.x,y:t.y,kind:t.kind})),level.enemies);
  assert.deepEqual(w.players.map(p=>({x:p.x,y:p.y})),level.playerSpawns);
  assert.equal(level.design!.identity,levels[id-1].design!.identity);
  assert.ok(level.enemies.length<=(count===3?8:9));assert.ok(level.enemies.length>=count);
  assert.ok(a.separation>=(count===3?252:288));
  assert.ok(a.idle>=3);for(const p of a.players){assert.ok(p.nearestEnemy>=400);assert.ok(p.escapeDirections>=4);}
  assert.deepEqual(a.routes.map(r=>r.player),Array.from({length:count},(_,i)=>i+1));
  const inputs=w.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:true}));
  for(let f=0;f<40;f++)w.update(.05,inputs[0],false,inputs.slice(1));
  assert.equal(w.alivePlayers.length,count,'simultaneous opening shots do not kill a teammate or immediately bounce into the shooter');
  for(const [index,e]of new World(level,count).enemies.entries())if(e.kind==='tactical'){
    const board=new World(level,count);
    assert.ok(a.routes.some(r=>r.path.filter((_,i)=>i%2===0).some(p=>canHitFrom(level,p,index,!lineClear(p,e,board.solids,5),count,r.player-1)))||level.design!.bankTargets?.some(b=>b.enemy===index&&canHitFrom(level,b.from,index,true,count)),`sentinel ${index+1} has a real solution with every teammate present`);
  }
  for(const b of level.design!.bankTargets??[])assert.ok(canHitFrom(level,b.from,b.enemy,true,count),'authored ricochet reaches its actual target');
  for(const gate of auditCork(level,count)){
    assert.ok(Number.isFinite(gate.before)&&gate.before-gate.after>5);
    const board=new World(level,count),o=board.obstacles[gate.obstacle];Object.assign(board.player,gate.from);board.player.turret=Math.atan2(gate.to.y-gate.from.y,gate.to.x-gate.from.x);
    for(let f=0;f<360&&o.alive;f++)board.update(1/120,{move:{x:0,y:0},aim:gate.to,fire:true},false);
    assert.equal(o.alive,false);
  }
});
for(const count of [3,4]as const)test(`${count} players: the expanded gallery cannot be escaped and its real bank shots remain usable`,()=>{
  const l=getLevel(25,count);
  for(let slot=0;slot<count;slot++){
    const w=new World(l,count),p=w.players[slot];
    w.players.filter(t=>t.id!==p.id).forEach(t=>t.alive=false);
    // The western extension must be sealed too, not just the original shooting bay.
    p.x=w.arena.x+70;
    for(let f=0;f<400;f++)w.move(p,{x:0,y:1},116.25,.05);
    assert.ok(p.y<Math.min(...w.holes.map(h=>h.y)));
    assert.ok(p.y>Math.min(...w.holes.map(h=>h.y))-60,'the tank actually reaches the pit barrier');
    for(let f=0;f<400;f++)w.move(p,{x:1,y:0},116.25,.05);
    assert.ok(p.x<w.obstacles[0].x);
    assert.ok(p.x>w.obstacles[0].x-60,'the tank actually reaches the separating wall');
  }
  assert.ok(l.enemies.every(e=>e.kind==='tactical'));assert.equal(l.enemies.length,count===3?4:5);
});
test('all team sizes retain the first scout, raider, sentinel and hunter introductions',()=>{
  for(const count of [3,4]as const){
    assert.ok([0,1].every(i=>getLevel(i,count).enemies.every(e=>e.kind==='basic')));
    assert.equal(getLevel(10,count).enemies.filter(e=>e.kind==='patrol').length,1);
    assert.ok(Array.from({length:20},(_,i)=>getLevel(i,count)).every(l=>l.enemies.every(e=>e.kind!=='tactical')));
    assert.equal(getLevel(20,count).enemies.filter(e=>e.kind==='tactical').length,1);
    assert.ok(Array.from({length:30},(_,i)=>getLevel(i,count)).every(l=>l.enemies.every(e=>e.kind!=='hunter')));
    assert.equal(getLevel(30,count).enemies.filter(e=>e.kind==='hunter').length,1);
    assert.ok(getLevel(4,count).obstacles.some(o=>o.destructible));assert.ok(getLevel(5,count).holes!.length>0);
  }
});
test('the historical geometry catalogs remain intact for chapter review comparisons',()=>{
  const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
  assert.equal(hash(templateCampaignVariants[1]),'e48e4242518f6f6f3cc4895a05bdc59acd721e2852483592cd7a4ffe87a63caa');
  assert.equal(hash(templateCampaignVariants[2]),'061466f8021733eb8062c49e20bfd83a8fbf4b70063411ca9ce4fe98e6b78c4a');
  assert.equal(hash(templateCampaignVariants[3].slice(20)),'1791f29fe4ec9e81f1f950df7f32d4d8789edacdd1d1090810dd80ea12379c84');
  assert.equal(hash(templateCampaignVariants[4].slice(20)),'7b6abfffb41ba899f14b9c76e1015984c630f4ef877c1b563a667e103d036a88');
});
