import type { Projectile, Tank, Vec } from './types';
import type { World } from './World';
import { lineClear, sweepCircle } from './CollisionManager';
import { enemyProfile } from './EnemyProfiles';

export const HUNTER_DEFENSE = { sight:500, horizon:.9, reaction:.1, dodgeTime:.34, dodgeRest:.45, guardTime:.2, turn:5.2, committed:.2 } as const;
export interface Threat { shot:Projectile; time:number }
export function visibleShells(w:World,t:Tank):Projectile[] {
  return w.projectiles.filter(s=>s.alive&&(s.owner!==t.id||s.bounces>0)&&Math.hypot(s.x-t.x,s.y-t.y)<HUNTER_DEFENSE.sight&&lineClear(t,s,w.solids,4));
}
/** Relative motion also catches a tank about to drive into a passing shell. No prediction through walls. */
export function incomingThreats(w:World,t:Tank,velocity:Vec):Threat[] {
  const horizon=HUNTER_DEFENSE.horizon;
  return visibleShells(w,t).flatMap(shot=>{
    const fraction=sweepCircle(shot,{x:(shot.vx-velocity.x)*horizon,y:(shot.vy-velocity.y)*horizon},t,t.radius+12);
    if(fraction===null)return [];
    const time=fraction*horizon,hit={x:shot.x+shot.vx*time,y:shot.y+shot.vy*time};
    return lineClear(shot,hit,w.solids,4)?[{shot,time}]:[];
  }).sort((a,b)=>a.time-b.time||a.shot.id-b.shot.id);
}
/** Check the whole short escape, including pits and tanks, and prefer the side with less crossfire. */
export function dodgeDirection(w:World,t:Tank,threat:Threat,speed:number):Vec|null {
  const shell=threat.shot,length=Math.hypot(shell.vx,shell.vy);if(!length)return null;
  const perpendicular={x:-shell.vy/length,y:shell.vx/length},shots=visibleShells(w,t);
  let best:Vec|null=null,bestClearance=-Infinity;
  for(const side of [-1,1]){
    const direction={x:perpendicular.x*side,y:perpendicular.y*side},duration=HUNTER_DEFENSE.dodgeTime;
    const end={x:t.x+direction.x*speed*duration,y:t.y+direction.y*speed*duration};
    if(!lineClear(t,end,w.movementSolids,t.radius+1))continue;
    if(Array.from({length:8},(_,i)=>({x:t.x+(end.x-t.x)*(i+1)/8,y:t.y+(end.y-t.y)*(i+1)/8})).some(p=>!w.canStand(p,t.radius+1,t.id)))continue;
    let clearance=Infinity;
    for(const s of shots){
      const vx=s.vx-direction.x*speed,vy=s.vy-direction.y*speed,rx=s.x-t.x,ry=s.y-t.y;
      const closest=Math.max(0,Math.min(duration,-(rx*vx+ry*vy)/(vx*vx+vy*vy||1)));
      const during=Math.hypot(rx+vx*closest,ry+vy*closest);
      const after=sweepCircle({x:s.x+s.vx*duration,y:s.y+s.vy*duration},{x:s.vx*(HUNTER_DEFENSE.horizon-duration),y:s.vy*(HUNTER_DEFENSE.horizon-duration)},end,t.radius+5);
      clearance=Math.min(clearance,during,after===null?Infinity:0);
    }
    if(clearance>t.radius+5&&clearance>bestClearance){best=direction;bestClearance=clearance;}
  }
  return best;
}
/** Lead a real shell from the muzzle; both missiles must meet before the incoming hit. */
export function countershotAngle(w:World,t:Tank,threat:Threat,delay:number):number|null {
  if(!Number.isFinite(delay)||delay<0||delay>=threat.time)return null;
  const s=threat.shot,speed=enemyProfile('hunter').speed,muzzle=32;
  const rx=s.x+s.vx*delay-t.x,ry=s.y+s.vy*delay-t.y;
  const a=s.vx*s.vx+s.vy*s.vy-speed*speed,b=2*(rx*s.vx+ry*s.vy-muzzle*speed),c=rx*rx+ry*ry-muzzle*muzzle;
  const discriminant=b*b-4*a*c;if(discriminant<0)return null;
  const roots=Math.abs(a)<1e-8?[-c/b]:[(-b-Math.sqrt(discriminant))/(2*a),(-b+Math.sqrt(discriminant))/(2*a)];
  const time=roots.filter(v=>Number.isFinite(v)&&v>0).sort((x,y)=>x-y)[0];
  if(time===undefined||delay+time>=threat.time-.025)return null;
  const hit={x:t.x+rx+s.vx*time,y:t.y+ry+s.vy*time};
  return lineClear(t,hit,w.solids,4)?Math.atan2(hit.y-t.y,hit.x-t.x):null;
}
