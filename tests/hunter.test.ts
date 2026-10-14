import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {World} from '../src/game/World.ts';
import {getLevel,levels,duoLevels,cooperativeLevels} from '../src/game/LevelManager.ts';
import {hunterTrial} from '../src/game/missions/hunterDebut.ts';
import {EnemyAI} from '../src/game/EnemyAI.ts';
import {HUNTER} from '../src/game/HunterAI.ts';
import {enemyProfile} from '../src/game/EnemyProfiles.ts';
import {findPath} from '../src/game/Navigation.ts';
import {lineClear} from '../src/game/CollisionManager.ts';
import type {Level,PlayerCount} from '../src/game/types.ts';
const fixture:Level={id:21,name:'Hunter test',subtitle:'',difficulty:2,player:{x:150,y:300},enemies:[{x:850,y:300,kind:'hunter'}],obstacles:[{x:400,y:360,w:44,h:120}]};
const idle={move:{x:0,y:0},aim:{x:10000,y:300},fire:false};
const step=(w:World,seconds:number)=>{for(let f=0;f<Math.ceil(seconds*120);f++)w.update(1/120,idle);};
const charging=(w:World)=>{const h=w.enemies.find(e=>e.kind==='hunter')!;for(let f=0;f<1800&&h.state!=='Windup';f++)w.update(1/120,idle);assert.equal(h.state,'Windup');return h;};

test('hunter chooses a lateral route instead of chasing directly and stays within movement clearance',()=>{
 const w=new World(fixture),h=w.enemies[0];step(w,.45);
 assert.equal(h.state,'Flank');assert.ok(Math.abs(h.goal.y-w.player.y)>150);
 assert.ok(findPath(h,h.goal,w.movementSolids,20,w.arena).length);
 let lateral=0;
 for(let f=0;f<350&&h.state!=='Windup';f++){w.update(1/120,idle);lateral=Math.max(lateral,Math.abs(h.y-300));assert.ok(w.canStand(h,h.radius,h.id));}
 assert.ok(lateral>100);assert.ok(h.distance>200);
});
for(const hz of [30,60,120])test(`hunter flanks faster than the moving player at ${hz} Hz without crossing cover`,()=>{
 const w=new World(fixture),h=w.enemies[0];step(w,.45);
 const start=h.distance,playerX=w.player.x;
 for(let f=0;f<hz/10;f++){
   w.update(1/hz,{...idle,move:{x:1,y:0}});
   assert.ok(w.canStand(h,h.radius,h.id));assert.equal(h.state,'Flank');
 }
 const playerTravel=w.player.x-playerX,hunterTravel=h.distance-start;
 assert.ok(Math.abs(hunterTravel/playerTravel-1.4)<.01,'real movement is 40% faster than the player');
});
test('hunter stops for a complete visible preparation and recovery, firing its fixed bearing',()=>{
 const w=new World(fixture),h=charging(w),where={x:h.x,y:h.y};
 const at=w.elapsed,aim=Math.atan2(w.player.y-h.y,w.player.x-h.x);w.player.y+=100;
 step(w,.3);assert.equal(h.shots,0);assert.deepEqual({x:h.x,y:h.y},where);assert.ok(h.hunter!.charge>.4);
 while(!h.shots&&w.elapsed<at+2)w.update(1/120,idle);
 assert.equal(h.shots,1);assert.ok(w.elapsed-at>=HUNTER.windup-.01);assert.equal(h.state,'Recover');
 const shell=w.projectiles.find(p=>p.owner===h.id)!;assert.ok(shell);assert.ok(Math.abs(Math.atan2(shell.vy,shell.vx)-aim)<.08,'aim was committed before the player moved');
 step(w,.5);assert.equal(h.state,'Recover');assert.deepEqual({x:h.x,y:h.y},where);
});
test('hidden positions are remembered briefly without tracking movement through walls',()=>{
 const w=new World({...fixture,obstacles:[]}),h=w.enemies[0];step(w,.1);assert.equal(h.hunter!.lastSeen!.x,150);
 w.obstacles.push({x:400,y:44,w:44,h:578,id:99,alive:true,destructible:false,hp:3});w.player.x=100;h.cooldown=10;
 step(w,1);assert.deepEqual(h.hunter!.lastSeen,{x:150,y:300});assert.ok(h.hunter!.memory>0);
 step(w,1.2);assert.equal(h.hunter!.targetId,null);assert.equal(h.hunter!.lastSeen,undefined);assert.equal(h.state,'Search');assert.equal(h.shots,0);
});
test('hunter cannot acquire or bank-shot a player it has never seen behind a full wall',()=>{
 const w=new World({...fixture,obstacles:[{x:400,y:44,w:44,h:578}]}),h=w.enemies[0];step(w,5);
 assert.equal(h.hunter!.targetId,null);assert.equal(h.hunter!.lastSeen,undefined);assert.equal(h.shots,0);assert.equal(h.state,'Search');
});
test('target commitment prevents rapid switches and a fallen target releases the commitment',()=>{
 const level={...fixture,obstacles:[],arena:{x:48,y:44,w:1184,h:578},playerSpawns:[{x:200,y:200},{x:200,y:450}]};const w=new World(level,2),h=w.enemies[0];
 step(w,.1);const chosen=h.hunter!.targetId!;const other=w.players.find(p=>p.id!==chosen)!;
 other.x=600;other.y=300;step(w,.8);assert.equal(h.hunter!.targetId,chosen);
 w.players.find(p=>p.id===chosen)!.alive=false;step(w,.1);assert.equal(h.hunter!.targetId,other.id);
});
test('a point-blank shot arrives before the hunter can react and prepare a countershot',()=>{
 const w=new World(fixture),h=charging(w);
 const d=Math.hypot(h.x-w.player.x,h.y-w.player.y),vx=(h.x-w.player.x)/d,vy=(h.y-w.player.y)/d;
 // Move to a clear firing post so flight time fits inside the telegraphed preparation.
 w.player.x=h.x-vx*100;w.player.y=h.y-vy*100;w.player.turret=Math.atan2(vy,vx);assert.ok(w.fire(w.player));
 for(let f=0;f<120&&h.alive;f++)w.update(1/120,{...idle,aim:{x:h.x,y:h.y}});
 assert.equal(h.alive,false);assert.equal(h.shots,0);assert.equal(w.events.filter(e=>e.type==='destroy'&&!e.player).length,1);
});
test('hunter weapon has double normal speed, one bounce, a fixed slow reload and one active shell',()=>{
 const w=new World({...fixture,obstacles:[]}),h=w.enemies[0];h.cooldown=0;h.turret=0;assert.ok(w.fire(h));
 const shell=w.projectiles[0];assert.equal(Math.hypot(shell.vx,shell.vy),645);assert.equal(shell.maxBounces,1);assert.equal(shell.propelled,false);assert.equal(h.cooldown,2.8);
 h.cooldown=0;assert.equal(w.fire(h),false);h.alive=false;
 for(let hit=0;hit<2;hit++){shell.x=w.arena.x+w.arena.w-5;shell.y=300;shell.vx=Math.abs(shell.vx);shell.vy=0;w.stepProjectile(shell,.01);assert.equal(shell.alive,hit===0);}
 assert.equal(enemyProfile('hunter').limit,1);
});
test('fast hunter and player missiles destroy each other even when they cross within one frame',()=>{
 const w=new World({...fixture,obstacles:[]}),h=w.enemies[0],p=w.player;
 // At the slowest simulation rate the two shells would swap sides without continuous collision detection.
 h.x=p.x+108;h.y=p.y;h.turret=Math.PI;h.cooldown=0;p.turret=0;
 assert.ok(w.fire(p));assert.ok(w.fire(h));
 w.update(.05,idle,false);
 assert.equal(w.projectiles.length,0);assert.equal(h.alive,true);assert.equal(p.alive,true);
 assert.equal(w.events.filter(e=>e.type==='shellCollision').length,1);
});
for(const count of [1,2,3,4]as PlayerCount[])test(`mission 21 and isolated hunter practice support ${count} players without multiplying hunters`,()=>{
 const l=getLevel(20,count),w=new World(l,count),trial=new World(hunterTrial(l),count);
 assert.equal(w.players.length,count);assert.equal(w.enemies.filter(e=>e.kind==='hunter').length,1);assert.equal(trial.enemies.length,1);assert.equal(trial.obstacles.length,2);
 assert.equal(w.enemies.length,count<=2?3:4);
 for(const t of [...w.tanks,...trial.tanks])assert.ok((w.tanks.includes(t)?w:trial).canStand(t,t.radius,t.id));
 for(const p of w.players){
   assert.ok(w.enemies.every(e=>Math.hypot(p.x-e.x,p.y-e.y)>295));
   assert.ok(findPath(p,w.enemies[0],w.movementSolids,20,w.arena).length);
   for(const teammate of w.players.filter(o=>o.id!==p.id)){assert.ok(Math.hypot(p.x-teammate.x,p.y-teammate.y)>=180*(1+(count-1)*.2));assert.ok(Math.abs(p.y-teammate.y)>=60*(1+(count-1)*.2));}
 }
 for(const r of l.design!.routes){
   const owner=w.players[(r.player??1)-1];let from={x:owner.x,y:owner.y};
   for(const point of r.points){
     assert.ok(w.canStand(point,20,owner.id),r.name);
     const path=findPath(from,point,w.movementSolids,20,w.arena);assert.ok(path.length||Math.hypot(from.x-point.x,from.y-point.y)<35);
     for(const next of [...path,point]){assert.ok(lineClear(from,next,w.movementSolids,20),`assigned route ${r.name} leaves clearance`);from=next;}
   }
 }
 const inputs=w.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:true}));for(let i=0;i<10;i++)w.update(.05,inputs[0],false,inputs.slice(1));assert.equal(w.alivePlayers.length,count);
 if(count>1){for(let i=0;i<30;i++)w.update(.05,inputs[0],false,inputs.slice(1));assert.equal(w.alivePlayers.length,count,'co-op starting bearings do not send an immediate wall ricochet back into a teammate');}
 for(const seed of [1,7,19]){
   const board=new World(l,count);let s=seed;board.ai=new EnemyAI(()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;});
   step(board,3);assert.equal(board.alivePlayers.length,count,'intro permits a reaction');
 }
});
test('hunter campaign preserves the introductory missions and its reviewed debut',()=>{
 const hash=(ls:Level[])=>createHash('sha256').update(JSON.stringify(ls.slice(0,21))).digest('hex');
 assert.equal(hash(levels),'efdaaf4522ab92619e369dc25f08969d3d8c4e23e9a5313e530085a3b3a7ce8a');assert.equal(hash(duoLevels),'52d470083c9839ca2eb0c87856229b8d7874daa16830fb6d4b4540fab8031e47');
 for(const count of [1,2,3,4]as PlayerCount[])for(let i=0;i<40;i++){
   const l=getLevel(i,count);assert.equal(l.enemies.some(e=>e.kind==='hunter'),i>=20&&i!==22);
   if(count>=3&&i<20)assert.equal(l,cooperativeLevels[i]);
 }
});
