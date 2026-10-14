import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getLevel,levels,duoLevels,cooperativeLevels} from '../src/game/LevelManager.ts';
import {World} from '../src/game/World.ts';
import {auditParty} from '../src/game/PartyAudit.ts';
import {auditCork,canHitFrom} from '../src/game/SoloAudit.ts';
import {lineClear} from '../src/game/CollisionManager.ts';
import {findPath} from '../src/game/Navigation.ts';

for(const count of [3,4] as const)for(let id=22;id<=40;id++)test(`${count} players, mission ${id}: bounded force, separated firing lanes, traversable roles and real defenses`,()=>{
  const level=getLevel(id-1,count),w=new World(level,count),a=auditParty(level,count,true);
  assert.deepEqual(a.issues,[],`${level.name}: ${a.issues.join('; ')}`);
  assert.equal(w.level,level);assert.deepEqual(w.enemies.map(t=>({x:t.x,y:t.y,kind:t.kind})),level.enemies,'no automatic waves');
  assert.deepEqual(w.players.map(p=>({x:p.x,y:p.y})),level.playerSpawns);
  assert.equal(level.enemies.length,duoLevels[id-1].enemies.length+count-2);
  assert.ok(level.enemies.length<cooperativeLevels[id-1].enemies.length*count);
  assert.ok(a.separation>=(count===3?252:288));
  assert.ok(a.idle>=3,'all three seeded AI runs leave an initial reaction window');
  assert.deepEqual(a.routes.map(r=>r.player),Array.from({length:count},(_,i)=>i+1));
  for(const p of a.players){assert.ok(p.nearestEnemy>=400);assert.ok(p.escapeDirections>=4);assert.ok(p.directThreats<=4);}
  const controls=w.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:true}));
  for(let f=0;f<40;f++)w.update(.05,controls[0],false,controls.slice(1));
  assert.equal(w.alivePlayers.length,count,'two seconds of opening fire cause no teammate or immediate self-ricochet deaths');
  for(const [index,e] of new World(level,count).enemies.entries())if(e.kind==='tactical'){
    const board=new World(level,count);
    assert.ok(a.routes.some(r=>r.path.filter((_,i)=>i%2===0).some(p=>canHitFrom(level,p,index,!lineClear(p,e,board.solids,5),count,r.player-1))),`sentinel ${index+1}: a real projectile can reach it with every teammate present`);
  }
  for(const gate of auditCork(level,count)){
    assert.ok(Number.isFinite(gate.before)&&gate.before-gate.after>5);
    const board=new World(level,count),obstacle=board.obstacles[gate.obstacle];Object.assign(board.player,gate.from);
    board.player.turret=Math.atan2(gate.to.y-gate.from.y,gate.to.x-gate.from.x);
    for(let f=0;f<360&&obstacle.alive;f++)board.update(1/120,{move:{x:0,y:0},aim:gate.to,fire:true},false);
    assert.equal(obstacle.alive,false);
  }
  for(const shot of level.design!.bankTargets??[])assert.ok(canHitFrom(level,shot.from,shot.enemy,true,count),'authored bank post reaches its actual target');
});
test('hunter encounters advance by chapter with explicit upper bounds and intentional strategy pauses',()=>{
  for(const count of [1,2,3,4] as const){
    const cap=[0,7,9,10,11][count];
    for(let id=22;id<=40;id++){
      const l=getLevel(id-1,count),hunters=l.enemies.filter(e=>e.kind==='hunter');
      assert.ok(l.enemies.length<=cap);assert.ok(hunters.length<=3);
      assert.equal(hunters.length>0,id!==23);
      if(id<30)assert.ok(hunters.length<=1,'first combinations retain one hunter for every team size');
      assert.equal(l.design!.identity,levels[id-1].design!.identity);
    }
    assert.equal(getLevel(29,count).enemies.filter(e=>e.kind==='hunter').length,2);
    assert.equal(getLevel(35,count).enemies.filter(e=>e.kind==='tactical').length,5,'preserve the five sentry mission');
  }
  assert.equal(getLevel(39,4).enemies.filter(e=>e.kind==='hunter').length,3);
});
test('navigation validates clearance between neighboring free cells around an obstacle corner',()=>{
  const boxes=[{x:200,y:196,w:44,h:44}],arena={x:48,y:44,w:400,h:400},start={x:143,y:215},end={x:295,y:177};
  const path=findPath(start,end,boxes,20,arena);assert.ok(path.length);
  let from=start;for(const p of [...path,end]){assert.ok(lineClear(from,p,boxes,21),'free endpoints alone do not establish a safe edge');from=p;}
});
test('published three/four-player atlas matches every playable team formation and its assigned lanes',()=>{
  const html=readFileSync('public/party-campaign-review.html','utf8'),match=html.match(/const data=(.*?);let index=0;/s);assert.ok(match);
  const reports=JSON.parse(match[1]);assert.equal(reports.length,40);
  for(const r of reports)for(const count of [3,4]as const){
    const v=r.variants[count];assert.deepEqual(v.level,getLevel(r.id-1,count));
    const audit=auditParty(v.level,count,true);assert.deepEqual(v.audit,audit);
  }
});
