import type { Level, Vec } from './types';
import { SHOT_SPEED } from './types';
import { World } from './World';
import { findPath, bankAngle } from './EnemyAI';
import { lineClear } from './CollisionManager';
export interface RouteAudit { name: string; path: Vec[]; length: number }
export interface SoloAudit { id: number; issues: string[]; routes: RouteAudit[]; directThreats: number; nearestEnemy: number; escapeDirections: number; bankTargets: number }
export function auditSolo(level: Level): SoloAudit {
  const world = new World(level), issues: string[] = [], routes: RouteAudit[] = [];
  if (!level.design) issues.push('Falta intención táctica');
  for (const tank of world.tanks) if (!world.canStand(tank,tank.radius,tank.id)) issues.push(`Aparición bloqueada: ${tank.kind} ${tank.id}`);
  for (const enemy of world.enemies) {
    const reachable = findPath(world.player,enemy,world.movementSolids,20,world.arena).length > 0;
    if (reachable === !!level.bankShotOnly) issues.push(`Conectividad incorrecta: enemigo ${enemy.id}`);
  }
  for (const route of level.design?.routes ?? []) {
    let from: Vec = level.player; const path: Vec[] = [from];
    for (const point of route.points) {
      if (!world.canStand(point,20,0)) issues.push(`${route.name}: puesto bloqueado ${point.x},${point.y}`);
      const segment = findPath(from,point,world.movementSolids,20,world.arena);
      if (!segment.length && Math.hypot(from.x-point.x,from.y-point.y)>35) issues.push(`${route.name}: puesto sin acceso`);
      for (const step of [...segment,point]) {
        if (!lineClear(path.at(-1)!,step,world.movementSolids,20)) issues.push(`${route.name}: paso sin holgura`);
        path.push(step);
      }
      from = point;
    }
    const length = path.reduce((sum,p,i)=>sum+(i ? Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y) : 0),0);
    routes.push({name:route.name,path,length});
  }
  const nearestEnemy = Math.min(...world.enemies.map(e=>Math.hypot(e.x-world.player.x,e.y-world.player.y)));
  const directThreats = world.enemies.filter(e=>lineClear(world.player,e,world.solids,5)).length;
  const escapeDirections = Array.from({length:8},(_,i)=>i*Math.PI/4).filter(angle=>{
    const p={x:world.player.x+Math.cos(angle)*60,y:world.player.y+Math.sin(angle)*60};
    return world.canStand(p,world.player.radius,0)&&lineClear(world.player,p,world.movementSolids,20);
  }).length;
  for (const shot of level.design?.bankTargets ?? []) {
    if (!world.canStand(shot.from,20,0) || !world.enemies[shot.enemy] || bankAngle(shot.from,world.enemies[shot.enemy],world.solids,SHOT_SPEED*6.8)===null)
      issues.push(`Puesto de rebote sin solución: enemigo ${shot.enemy+1}`);
  }
  return {id:level.id,issues:[...new Set(issues)],routes,directThreats,nearestEnemy,escapeDirections,bankTargets:level.design?.bankTargets?.length??0};
}
/** Real projectile geometry, including tank bodies, wall ricochets and the seven-second lifetime. */
export function canHitFrom(level: Level, from: Vec, index: number, ricochet: boolean): boolean {
  const world = new World(level), target = world.enemies[index];
  if (!world.canStand(from,world.player.radius,0)) return false;
  Object.assign(world.player,from);
  const angle = ricochet ? bankAngle(from,target,world.solids,SHOT_SPEED*6.8) : Math.atan2(target.y-from.y,target.x-from.x);
  if (angle===null) return false;
  world.player.turret=angle;
  if (!world.fire(world.player)) return false;
  for(let frame=0;frame<840&&target.alive&&world.player.alive&&world.projectiles.length;frame++)
    world.update(1/120,{move:{x:0,y:0},aim:{x:from.x+Math.cos(angle)*10000,y:from.y+Math.sin(angle)*10000},fire:false},false);
  return !target.alive && (!ricochet || world.events.some(event=>event.type==='bounce'));
}
export interface CorkAudit { obstacle: number; before: number; after: number; from: Vec; to: Vec; afterPath: Vec[] }
/** Compare a passage across each cork piece with the same passage after its destruction. */
export function auditCork(level: Level): CorkAudit[] {
  const world=new World(level), results:CorkAudit[]=[];
  const length=(from:Vec,to:Vec)=>{
    const path=findPath(from,to,world.movementSolids,20,world.arena);
    if(!path.length)return Infinity;
    const points=[from,...path,to];return points.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0),0);
  };
  for(const o of world.obstacles.filter(o=>o.destructible)){
    const vertical=o.h>o.w;
    const from=vertical?{x:o.x-60,y:o.y+o.h/2}:{x:o.x+o.w/2,y:o.y-60};
    const to=vertical?{x:o.x+o.w+60,y:o.y+o.h/2}:{x:o.x+o.w/2,y:o.y+o.h+60};
    const before=length(from,to);o.alive=false;const after=length(from,to);const afterPath=[from,...findPath(from,to,world.movementSolids,20,world.arena),to];o.alive=true;
    results.push({obstacle:o.id,before,after,from,to,afterPath});
  }
  return results;
}
