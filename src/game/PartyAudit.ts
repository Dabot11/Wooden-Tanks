import type { Level, Vec } from './types';
import { World } from './World';
import { EnemyAI, findPath } from './EnemyAI';
import { lineClear } from './CollisionManager';
import type { RouteAudit } from './SoloAudit';

/** Validate each assigned lane with every teammate present; pressure is a reaction check, not a win estimate. */
export function auditParty(level:Level,count:3|4,pressure=false) {
  const w=new World(level,count),issues:string[]=[],routes:(RouteAudit&{player:number})[]=[];
  if(level.playerSpawns?.length!==count||level.design?.cooperation?.roles.length!==count)issues.push('Falta despliegue o papeles del equipo');
  for(const t of w.tanks)if(!w.canStand(t,t.radius,t.id))issues.push(`Aparición bloqueada: ${t.kind} ${t.id}`);
  const players=w.players.map(p=>({nearestEnemy:Math.min(...w.enemies.map(e=>Math.hypot(e.x-p.x,e.y-p.y))),
    directThreats:w.enemies.filter(e=>lineClear(p,e,w.solids,5)).length,
    escapeDirections:Array.from({length:8},(_,i)=>i*Math.PI/4).filter(angle=>{
      const to={x:p.x+Math.cos(angle)*60,y:p.y+Math.sin(angle)*60};return w.canStand(to,p.radius,p.id)&&lineClear(p,to,w.movementSolids,20);
    }).length}));
  for(const r of level.design?.routes??[]){
    const p=w.players[(r.player??1)-1];if(!p){issues.push('Ruta sin jugador');continue;}
    let from:Vec=p;const path:Vec[]=[{x:p.x,y:p.y}];
    for(const point of r.points){
      if(!w.canStand(point,20,p.id))issues.push(`${r.name}: puesto bloqueado`);
      const segment=findPath(from,point,w.movementSolids,20,w.arena);
      if(!segment.length&&Math.hypot(from.x-point.x,from.y-point.y)>35)issues.push(`${r.name}: puesto sin acceso`);
      for(const next of [...segment,point]){if(!lineClear(path.at(-1)!,next,w.movementSolids,20))issues.push(`${r.name}: paso sin holgura`);path.push(next);}
      from=point;
    }
    routes.push({player:r.player??1,name:r.name,path,length:path.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y):0),0)});
  }
  const rally=level.design?.cooperation?.rally;
  for(const p of w.players){
    if(!rally||!w.canStand(rally,20,p.id)||!findPath(p,rally,w.movementSolids,20,w.arena).length)issues.push('Reagrupamiento bloqueado');
    for(const e of w.enemies)if(!findPath(p,e,w.movementSolids,20,w.arena).length)issues.push(`Enemigo sin acceso para P${1-p.id}`);
  }
  let idle=8;
  if(pressure)for(const seed of [1,7,19]){
    const board=new World(level,count);let state=seed;
    board.ai=new EnemyAI(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
    const inputs=board.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:false}));
    while(board.alivePlayers.length===count&&board.elapsed<8)board.update(1/30,inputs[0],true,inputs.slice(1));
    idle=Math.min(idle,board.elapsed);
  }
  const separation=Math.min(...w.players.flatMap((p,i)=>w.players.slice(i+1).map(q=>Math.hypot(p.x-q.x,p.y-q.y))));
  return {issues:[...new Set(issues)],players,routes,separation,idle};
}
