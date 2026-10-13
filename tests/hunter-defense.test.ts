import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/game/World.ts';
import {createTank} from '../src/game/Tank.ts';
import {HUNTER} from '../src/game/HunterAI.ts';
import {HUNTER_DEFENSE,incomingThreats,dodgeDirection,countershotAngle} from '../src/game/HunterDefense.ts';
import type {Level,Projectile} from '../src/game/types.ts';
const fixture:Level={id:21,name:'Defense test',subtitle:'',difficulty:2,player:{x:150,y:300},enemies:[{x:850,y:300,kind:'hunter'}],obstacles:[]};
const idle={move:{x:0,y:0},aim:{x:10000,y:300},fire:false};
const shell=(x:number,y:number,vx=322.5,vy=0):Projectile=>({id:9900,owner:0,x,y,vx,vy,age:0,bounces:0,alive:true});
function charging(){
  const w=new World(fixture),h=w.enemies[0];
  for(let f=0;f<1800&&h.state!=='Windup';f++)w.update(1/120,idle);
  assert.equal(h.state,'Windup');return {w,h};
}
function shoot(w:World,range:number){
  const h=w.enemies[0],p=w.player,angle=Math.atan2(h.y-p.y,h.x-p.x);
  p.x=h.x-Math.cos(angle)*range;p.y=h.y-Math.sin(angle)*range;p.turret=angle;
  assert.ok(w.fire(p));return {move:{x:0,y:0},aim:{x:h.x,y:h.y},fire:false};
}
test('threat detection requires a visible incoming trajectory and ignores departing, expired and unbounced own shells',()=>{
  const w=new World(fixture),h=w.enemies[0];h.x=650;
  const incoming=shell(450,300);w.projectiles=[incoming];assert.equal(incomingThreats(w,h,{x:0,y:0}).length,1);
  incoming.vx=-322.5;assert.equal(incomingThreats(w,h,{x:0,y:0}).length,0);
  incoming.vx=322.5;incoming.age=6.8;assert.equal(incomingThreats(w,h,{x:0,y:0}).length,0);
  incoming.age=0;incoming.owner=h.id;assert.equal(incomingThreats(w,h,{x:0,y:0}).length,0);
  incoming.bounces=1;assert.equal(incomingThreats(w,h,{x:0,y:0}).length,1);
  w.obstacles.push({id:99,x:520,y:250,w:44,h:100,alive:true,destructible:false,hp:3});assert.equal(incomingThreats(w,h,{x:0,y:0}).length,0);
});
test('relative prediction detects movement into a passing missile that would miss a stationary hunter',()=>{
  const w=new World(fixture),h=w.enemies[0];h.x=650;w.projectiles=[shell(550,260)];
  assert.equal(incomingThreats(w,h,{x:0,y:0}).length,0);
  assert.equal(incomingThreats(w,h,{x:0,y:-HUNTER.speed}).length,1);
});
test('evasion checks the whole route and chooses the side without a pit, wall or tank',()=>{
  const w=new World(fixture),h=w.enemies[0];h.x=650;w.projectiles=[shell(450,300)];
  w.holes.push({x:650,y:260,radius:15});
  const threat=incomingThreats(w,h,{x:0,y:0})[0];
  const dodge=dodgeDirection(w,h,threat,HUNTER.speed)!;assert.ok(Math.abs(dodge.x)<1e-8);assert.equal(dodge.y,1);
  w.tanks.push(createTank(77,'basic',{x:650,y:345}));assert.equal(dodgeDirection(w,h,threat,HUNTER.speed),null);w.tanks.pop();
  w.obstacles.push({id:99,x:620,y:335,w:60,h:44,alive:true,destructible:false,hp:3});
  assert.equal(dodgeDirection(w,h,threat,HUNTER.speed),null);
});
test('evasion avoids crossfire on the preferred side instead of blindly choosing a perpendicular direction',()=>{
  const w=new World(fixture),h=w.enemies[0];h.x=650;
  w.projectiles=[shell(450,300),{...shell(555,260),id:9901}];
  const threat=incomingThreats(w,h,{x:0,y:0})[0];
  const dodge=dodgeDirection(w,h,threat,HUNTER.speed)!;assert.ok(Math.abs(dodge.x)<1e-8);assert.equal(dodge.y,1);
});
for(const hz of [30,60,120])test(`a hunter on cooldown evades a real shot and does not return into its path at ${hz} Hz`,()=>{
  const {w,h}=charging();h.cooldown=10;const input=shoot(w,250),start={x:h.x,y:h.y};
  let evaded=false,maxTravel=0;
  for(let f=0;f<hz*1.2;f++){
    const before={x:h.x,y:h.y};w.update(1/hz,input);
    evaded ||= h.state==='Evade';maxTravel=Math.max(maxTravel,Math.hypot(h.x-start.x,h.y-start.y));
    assert.ok(Math.hypot(h.x-before.x,h.y-before.y)<=HUNTER.speed/hz+.001,'no teleport or speed bonus');
    assert.ok(w.canStand(h,h.radius,h.id));
  }
  assert.equal(evaded,true);assert.equal(h.alive,true);assert.equal(h.shots,0);assert.ok(maxTravel>40);
});
test('a charging hunter blocks a real shell using its only missile, announces its guard and remains vulnerable during recovery',()=>{
  const {w,h}=charging();h.cooldown=0;const input=shoot(w,250),firedAt=w.elapsed;
  let guardAt:number|undefined;
  while(!w.events.some(e=>e.type==='shellCollision')&&w.elapsed<firedAt+1){
    w.update(1/120,input);if(h.state==='Guard'&&guardAt===undefined)guardAt=w.elapsed;
  }
  assert.ok(guardAt!==undefined);assert.equal(h.alive,true);assert.equal(h.shots,1);assert.equal(h.state,'Recover');
  assert.equal(w.events.filter(e=>e.type==='shellCollision').length,1);assert.equal(w.events.filter(e=>e.type==='hunterWindup').length,2);
  assert.ok(w.elapsed-guardAt>=HUNTER_DEFENSE.guardTime);assert.ok(h.cooldown>2.4);
  // A second real missile at close range beats the shared reload and the full stationary recovery.
  while(w.player.cooldown>0)w.update(1/120,input);
  const where={x:h.x,y:h.y};shoot(w,100);
  for(let f=0;f<45&&h.alive;f++)w.update(1/120,input);
  assert.equal(h.alive,false);assert.equal(h.shots,1);assert.deepEqual({x:h.x,y:h.y},where);
});
test('an existing hunter missile prevents a second defensive missile even with an artificially ready cooldown',()=>{
  const {w,h}=charging();h.cooldown=0;h.turret=0;assert.ok(w.fire(h));h.cooldown=0;
  const input=shoot(w,250);let evaded=false;
  for(let f=0;f<36;f++){w.update(1/120,input);evaded ||= h.state==='Evade';}
  assert.equal(evaded,true);assert.equal(h.shots,1);assert.equal(h.alive,true);
});
test('a vanished incoming shell cancels the guard instead of producing a phantom countershot',()=>{
  const {w,h}=charging();h.cooldown=0;const input=shoot(w,250);
  for(let f=0;f<36&&h.state!=='Guard';f++)w.update(1/120,input);
  assert.equal(h.state,'Guard');w.projectiles=[];
  for(let f=0;f<24;f++)w.update(1/120,input);
  assert.notEqual(h.state,'Guard');assert.equal(h.shots,0);
});
test('the committed final part of an offensive windup cannot be cancelled into an invincible dodge',()=>{
  const {w,h}=charging(),started=w.elapsed;
  while(w.elapsed-started<HUNTER.windup-HUNTER_DEFENSE.committed+.015)w.update(1/120,idle);
  const input=shoot(w,100),where={x:h.x,y:h.y};
  for(let f=0;f<45&&h.alive;f++)w.update(1/120,input);
  assert.equal(h.alive,false);assert.deepEqual({x:h.x,y:h.y},where);
});
test('countershot leads an oblique incoming shell and handles equal speeds with a real collision',()=>{
  for(const speed of [322.5,645]){
    const w=new World(fixture),h=w.enemies[0];h.x=650;
    const s=shell(430,250,speed,0),threat={shot:s,time:.7};
    const angle=countershotAngle(w,h,threat,.2);assert.ok(angle!==null&&Number.isFinite(angle));
    s.x+=s.vx*.2;s.y+=s.vy*.2;s.age+=.2;
    h.cooldown=0;h.turret=angle;w.projectiles=[s];assert.ok(w.fire(h));
    for(let f=0;f<60&&!w.events.some(e=>e.type==='shellCollision');f++)w.update(1/120,idle,false);
    assert.equal(w.events.filter(e=>e.type==='shellCollision').length,1);assert.equal(h.alive,true);
  }
});
