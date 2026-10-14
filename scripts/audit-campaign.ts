import { writeFileSync } from 'node:fs';
import { campaignVariants } from '../src/game/LevelManager';
import { auditSolo, auditCork, canHitFrom } from '../src/game/SoloAudit';
import { auditDuo } from '../src/game/DuoAudit';
import { auditParty } from '../src/game/PartyAudit';
import { World } from '../src/game/World';
import { EnemyAI } from '../src/game/EnemyAI';
import { lineClear } from '../src/game/CollisionManager';
const results=[];
for(const count of [1,2,3,4]as const)for(const level of campaignVariants[count]){
  const a=count===1?auditSolo(level):count===2?auditDuo(level,true):auditParty(level,count,true),w=new World(level,count),issues=[...a.issues];
  let idle='idle' in a?a.idle:8;
  const players='players' in a?a.players:[a];
  for(const p of players)if(p.escapeDirections<4||p.nearestEnemy<(count<=2?295:400)||p.directThreats>(count<=2?2:4))issues.push('Aparición sin distancia, cobertura o salidas suficientes');
  for(const [i,p]of w.players.entries())for(const q of w.players.slice(i+1))if(Math.hypot(p.x-q.x,p.y-q.y)<180*(1+(count-1)*.2)||Math.abs(p.y-q.y)<60*(1+(count-1)*.2))issues.push('Carriles iniciales demasiado cercanos');
  if(count===1)for(const seed of [1,7,19]){
    let state=seed;const board=new World(level);board.ai=new EnemyAI(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
    while(board.player.alive&&board.elapsed<8)board.update(1/30,{move:{x:0,y:0},aim:{x:board.player.x,y:board.player.y-100},fire:false});idle=Math.min(idle,board.elapsed);
  }
  if(idle<(count>=3?3:level.id<=10?3:2.2))issues.push(`Presión inicial ${idle.toFixed(2)}`);
  const inputs=w.players.map(p=>({move:{x:0,y:0},aim:{x:p.x+10000,y:p.y},fire:true}));
  for(let f=0;f<40;f++)w.update(.05,inputs[0],false,inputs.slice(1));
  if(w.alivePlayers.length!==count)issues.push('Apertura con fuego amigo insegura');
  const board=new World(level,count);
  for(const [index,e]of board.enemies.entries())if(e.kind==='tactical'){
    const success=a.routes.some(r=>{const slot='player' in r?(r.player as number)-1:0;return r.path.filter((_,i)=>i%2===0).some(p=>canHitFrom(level,p,index,!lineClear(p,e,board.solids,5),count,slot));})||level.design!.bankTargets?.some(b=>b.enemy===index&&canHitFrom(level,b.from,index,true,count));
    if(!success)issues.push(`Centinela ${index+1} sin tiro real desde rutas`);
  }
  for(const b of level.design!.bankTargets??[])if(!canHitFrom(level,b.from,b.enemy,true,count))issues.push(`Rebote fallido ${b.enemy+1}`);
  for(const gate of auditCork(level,count))if(!Number.isFinite(gate.before)||gate.before-gate.after<=5)issues.push(`Corcho inútil ${gate.obstacle+1}`);
  results.push({id:level.id,count,issues,idle,routes:a.routes.length,enemies:level.enemies.length});
  if(issues.length)console.log(`${level.id}/${count}: ${issues.join('; ')}`);
}
writeFileSync('/tmp/chapter-audit.json',JSON.stringify(results));
console.log(`${results.length} variantes; ${results.filter(r=>r.issues.length).length} pendientes`);
if(results.some(r=>r.issues.length))process.exitCode=1;
