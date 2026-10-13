import type { Level, Vec } from './types';
import { World } from './World';
import { EnemyAI, findPath } from './EnemyAI';
import { lineClear } from './CollisionManager';
import type { RouteAudit } from './SoloAudit';
export interface DuoAudit {
  issues:string[]; routes:(RouteAudit & {player:number})[];
  players:{nearestEnemy:number;directThreats:number;escapeDirections:number}[];
  separation:number; idle:number;
}
export function auditDuo(level:Level, pressure=false):DuoAudit {
  const w=new World(level,2),issues:string[]=[],routes:DuoAudit['routes']=[];
  if(level.playerSpawns?.length!==2 || !level.design?.cooperation)issues.push('Falta formación o estrategia de pareja');
  for(const t of w.tanks)if(!w.canStand(t,t.radius,t.id))issues.push(`Aparición bloqueada: ${t.kind} ${t.id}`);
  const players=w.players.map(p=>({
    nearestEnemy:Math.min(...w.enemies.map(e=>Math.hypot(p.x-e.x,p.y-e.y))),
    directThreats:w.enemies.filter(e=>lineClear(p,e,w.solids,5)).length,
    escapeDirections:Array.from({length:8},(_,i)=>i*Math.PI/4).filter(angle=>{
      const to={x:p.x+Math.cos(angle)*60,y:p.y+Math.sin(angle)*60};
      return w.canStand(to,p.radius,p.id)&&lineClear(p,to,w.movementSolids,20);
    }).length,
  }));
  for(const route of level.design?.routes??[]) {
    const player=w.players[(route.player??1)-1]; let from:Vec=player; const path:Vec[]=[{x:player.x,y:player.y}];
    for(const point of route.points) {
      if(!w.canStand(point,20,player.id))issues.push(`${route.name}: puesto bloqueado ${point.x},${point.y}`);
      const segment=findPath(from,point,w.movementSolids,20,w.arena);
      if(!segment.length&&Math.hypot(from.x-point.x,from.y-point.y)>35)issues.push(`${route.name}: puesto sin acceso`);
      for(const step of [...segment,point]) {
        if(!lineClear(path.at(-1)!,step,w.movementSolids,20))issues.push(`${route.name}: paso sin holgura`);
        path.push(step);
      }
      from=point;
    }
    routes.push({player:route.player??1,name:route.name,path,length:path.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y):0),0)});
  }
  const rally=level.design?.cooperation?.rally;
  if(rally)for(const p of w.players)if(!w.canStand(rally,20,p.id)||!findPath(p,rally,w.movementSolids,20,w.arena).length)issues.push('Reagrupamiento bloqueado');
  if(!findPath(w.player,w.players[1],w.movementSolids,20,w.arena).length)issues.push('Los compañeros no pueden reunirse');
  for(const e of w.enemies)for(const p of w.players) {
    const path=findPath(p,e,w.movementSolids,20,w.arena);
    if(!!path.length===!!level.bankShotOnly)issues.push(`Conectividad incorrecta P${p.id===0?1:2}: enemigo ${e.id}`);
  }
  let idle=8;
  if(pressure)for(const seed of [1,7,19]) {
    let state=seed;const world=new World(level,2);
    world.ai=new EnemyAI(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
    const controls=world.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:false}));
    while(world.alivePlayers.length===2&&world.elapsed<8)world.update(1/30,controls[0],true,controls[1]);
    idle=Math.min(idle,world.elapsed);
  }
  return {issues:[...new Set(issues)],routes,players,separation:Math.hypot(w.player.x-w.players[1].x,w.player.y-w.players[1].y),idle};
}
