import { TANK_SPEED, wrapAngle } from './types';
import { enemyProfile } from './EnemyProfiles';
import type { Tank, Vec } from './types';
import type { World } from './World';
import { lineClear } from './CollisionManager';
import { findPath, bankAngle } from './Navigation';
import { HUNTER_DEFENSE, incomingThreats, dodgeDirection, countershotAngle } from './HunterDefense';
export const HUNTER = { speed:TANK_SPEED*1.4, windup:.65, recovery:.65, memory:2, commitment:2.8, cooldown:2.8 } as const;
interface Plan { targetId:number|null; lastSeen?:Vec; memory:number; commitment:number; decision:number; phaseTime:number; angle:number|null; stuck:number; search:number; threatId:number|null; reaction:number; dodgeRest:number; dodge:Vec|null; guardId:number|null }
const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y);
const position=(p:Vec):Vec=>({x:p.x,y:p.y});
/** A fast flanker with finite sight memory, fixed telegraphed aim and one fast shell. */
export class HunterAI {
  private plans=new Map<number,Plan>();
  private shotAngle(w:World,t:Tank,target:Vec):number|null {
    return lineClear(t,target,w.solids,5)?Math.atan2(target.y-t.y,target.x-t.x):bankAngle(t,target,w.solids,enemyProfile('hunter').speed*6.8);
  }
  private chooseTarget(w:World,t:Tank):Tank|undefined {
    const visible=w.alivePlayers.filter(p=>lineClear(t,p,w.solids,5));
    return visible.sort((a,b)=>{
      const score=(p:Tank)=>distance(t,p)-Math.min(300,...visible.filter(o=>o.id!==p.id).map(o=>distance(o,p)))*.5;
      return score(a)-score(b)||a.id-b.id;
    })[0];
  }
  private flank(w:World,t:Tank,target:Vec):Vec {
    const d=Math.max(1,distance(t,target)),nx=(t.x-target.x)/d,ny=(t.y-target.y)/d;
    const points:Vec[]=[];
    for(const side of [-1,1])for(const range of [220,340])points.push({x:target.x+nx*range-ny*side*210,y:target.y+ny*range+nx*side*210});
    for(const o of w.obstacles.filter(o=>o.alive))for(const x of [o.x-54,o.x+o.w+54])for(const y of [o.y-54,o.y+o.h+54])points.push({x,y});
    const score=(p:Vec)=>{
      const separation=Math.abs(wrapAngle(Math.atan2(p.y-target.y,p.x-target.x)-Math.atan2(t.y-target.y,t.x-target.x)));
      return distance(t,p)+Math.abs(distance(p,target)-320)*.3-separation*150+(lineClear(p,target,w.solids,5)?0:90);
    };
    const candidates=points.filter(p=>distance(t,p)>75&&distance(p,target)>170&&distance(p,target)<680&&w.canStand(p,23,t.id)).sort((a,b)=>score(a)-score(b));
    for(const p of candidates)if(findPath(t,p,w.movementSolids,20,w.arena).length)return p;
    return position(t);
  }
  private searchGoal(w:World,t:Tank,p:Plan):Vec {
    // Search visible terrain and remembered routes, never the hidden player's live coordinates.
    const a=w.arena,points=[{x:a.x+a.w*.3,y:a.y+a.h*.2},{x:a.x+a.w*.3,y:a.y+a.h*.8},{x:a.x+a.w*.65,y:a.y+a.h*.8},{x:a.x+a.w*.65,y:a.y+a.h*.2}];
    for(let i=0;i<points.length;i++){
      const goal=points[p.search++%points.length];
      if(w.canStand(goal,23,t.id)&&distance(t,goal)>80&&findPath(t,goal,w.movementSolids,20,a).length)return goal;
    }
    return position(t);
  }
  private route(w:World,t:Tank,goal:Vec) { t.goal=position(goal);t.path=findPath(t,goal,w.movementSolids,20,w.arena); }
  private travel(w:World,t:Tank,p:Plan,dt:number) {
    while(t.path.length&&distance(t,t.path[0])<9)t.path.shift();
    const next=t.path[0];if(!next)return;
    const before=position(t);w.move(t,{x:next.x-t.x,y:next.y-t.y},Math.min(HUNTER.speed,distance(t,next)/dt),dt);
    p.stuck=distance(before,t)<.01?p.stuck+dt:0;
    if(p.stuck>.7){t.path=[];p.decision=0;p.stuck=0;}
  }
  private defend(w:World,t:Tank,p:Plan,dt:number):boolean {
    if(t.state==='Evade'){
      if(p.phaseTime>0&&p.dodge&&w.canStand({x:t.x+p.dodge.x*HUNTER.speed*dt,y:t.y+p.dodge.y*HUNTER.speed*dt},t.radius,t.id)){
        w.move(t,p.dodge,HUNTER.speed,dt);return true;
      }
      t.state='Flank';p.dodge=null;p.decision=0;
    }
    if(t.state==='Guard'){
      const threat=incomingThreats(w,t,{x:0,y:0}).find(s=>s.shot.id===p.guardId);
      let angle=threat?countershotAngle(w,t,threat,Math.max(0,p.phaseTime)):null;
      if(threat&&angle!==null){
        const delay=Math.max(0,p.phaseTime,Math.abs(wrapAngle(angle-t.turret))/HUNTER_DEFENSE.turn);
        angle=countershotAngle(w,t,threat,delay);
      }
      if(angle!==null){
        const change=wrapAngle(angle-t.turret);t.turret+=Math.sign(change)*Math.min(Math.abs(change),HUNTER_DEFENSE.turn*dt);
        t.hunter!.charge=Math.min(1,1-p.phaseTime/HUNTER_DEFENSE.guardTime);
        if(p.phaseTime<=0&&Math.abs(wrapAngle(angle-t.turret))<.07&&w.fire(t)){
          t.state='Recover';p.phaseTime=HUNTER.recovery;p.guardId=null;p.decision=0;t.hunter!.charge=0;
        }
        return true;
      }
      // A blocked, destroyed or no longer interceptable shell releases the defensive aim.
      t.state='Flank';p.guardId=null;p.decision=0;t.hunter!.charge=0;
    }
    if(t.state==='Windup'&&p.phaseTime<=HUNTER_DEFENSE.committed)return false;
    const next=t.path.find(point=>distance(t,point)>=9),d=next?distance(t,next):0;
    const velocity=t.state==='Windup'||!next?{x:0,y:0}:{x:(next.x-t.x)/d*HUNTER.speed,y:(next.y-t.y)/d*HUNTER.speed};
    const threat=incomingThreats(w,t,velocity)[0];
    if(!threat){p.threatId=null;p.reaction=HUNTER_DEFENSE.reaction;return false;}
    if(p.threatId!==threat.shot.id){p.threatId=threat.shot.id;p.reaction=HUNTER_DEFENSE.reaction;}
    else p.reaction-=dt;
    if(p.reaction>0)return false;
    const dodge=p.dodgeRest<=0?dodgeDirection(w,t,threat,HUNTER.speed):null;
    const armed=t.cooldown<=0&&!w.projectiles.some(s=>s.alive&&s.owner===t.id);
    if(armed&&(t.state==='Windup'||!dodge)){
      const angle=countershotAngle(w,t,threat,HUNTER_DEFENSE.guardTime);
      const delay=angle===null?Infinity:Math.max(HUNTER_DEFENSE.guardTime,Math.abs(wrapAngle(angle-t.turret))/HUNTER_DEFENSE.turn);
      if(countershotAngle(w,t,threat,delay)!==null){
        t.state='Guard';p.guardId=threat.shot.id;p.phaseTime=HUNTER_DEFENSE.guardTime;p.angle=null;t.path=[];t.hunter!.charge=0;
        w.events.push({type:'hunterWindup',x:t.x,y:t.y});return true;
      }
    }
    if(dodge){
      t.state='Evade';p.dodge=dodge;p.phaseTime=HUNTER_DEFENSE.dodgeTime;p.dodgeRest=HUNTER_DEFENSE.dodgeTime+HUNTER_DEFENSE.dodgeRest;
      t.path=[];p.angle=null;p.decision=0;t.hunter!.charge=0;w.move(t,dodge,HUNTER.speed,dt);return true;
    }
    // Do not immediately walk back into the same firing lane after a successful sidestep.
    if(!incomingThreats(w,t,{x:0,y:0}).length)return true;
    return false;
  }
  update(w:World,t:Tank,dt:number) {
    let p=this.plans.get(t.id);
    if(!p){p={targetId:null,memory:0,commitment:0,decision:0,phaseTime:.4,angle:null,stuck:0,search:t.id%4,threatId:null,reaction:HUNTER_DEFENSE.reaction,dodgeRest:0,dodge:null,guardId:null};this.plans.set(t.id,p);t.state='Observe';}
    p.commitment-=dt;p.decision-=dt;p.phaseTime-=dt;p.dodgeRest=Math.max(0,p.dodgeRest-dt);
    let target=w.alivePlayers.find(player=>player.id===p!.targetId);
    if(!target){p.targetId=null;p.memory=0;}
    if(!target||(p.commitment<=0&&t.state!=='Windup')){
      const visible=this.chooseTarget(w,t);
      if(visible){
        if(visible.id!==p.targetId&&!['Guard','Evade','Recover'].includes(t.state)){t.path=[];t.state='Observe';p.phaseTime=.4;p.decision=0;p.angle=null;}
        target=visible;p.targetId=visible.id;p.commitment=HUNTER.commitment;
      }
    }
    if(target&&lineClear(t,target,w.solids,5)){p.lastSeen=position(target);p.memory=HUNTER.memory;}
    else p.memory=Math.max(0,p.memory-dt);
    if(!p.memory){p.targetId=null;p.lastSeen=undefined;}
    t.hunter={targetId:p.targetId,...(p.lastSeen?{lastSeen:position(p.lastSeen)}:{}),memory:p.memory,charge:t.state==='Windup'?Math.min(1,1-p.phaseTime/HUNTER.windup):0};
    if(t.state==='Observe'&&p.phaseTime>0)return;
    if(t.state==='Recover'&&p.phaseTime>0)return;
    if(this.defend(w,t,p,dt))return;
    if(t.state==='Windup'){
      if(!p.lastSeen||p.angle===null){t.state='Search';p.decision=0;return;}
      const change=wrapAngle(p.angle-t.turret);t.turret+=Math.sign(change)*Math.min(Math.abs(change),3.6*dt);
      if(p.phaseTime<=0&&Math.abs(wrapAngle(p.angle-t.turret))<.07){
        if(w.fire(t)){t.state='Recover';p.phaseTime=HUNTER.recovery;t.hunter.charge=0;p.decision=0;}
        else {t.state='Flank';p.decision=0;}
      }
      return;
    }
    const armed=t.cooldown<=0&&!w.projectiles.some(s=>s.alive&&s.owner===t.id);
    if(p.lastSeen){
      t.state='Flank';
      if(p.decision<=0&&(!t.path.length||distance(t,t.goal)<30)){
        this.route(w,t,this.flank(w,t,p.lastSeen));p.decision=.7;
      }
      this.travel(w,t,p,dt);
      const angle=this.shotAngle(w,t,p.lastSeen);
      if(armed&&angle!==null&&distance(t,t.goal)<35){
        t.state='Windup';p.angle=angle;p.phaseTime=HUNTER.windup;t.hunter.charge=0;
        w.events.push({type:'hunterWindup',x:t.x,y:t.y});
      }
    }else{
      t.state='Search';
      if(!t.path.length||distance(t,t.goal)<30){this.route(w,t,this.searchGoal(w,t,p));p.decision=.7;}
      this.travel(w,t,p,dt);
    }
    if(t.state!=='Windup'){
      const angle=p.lastSeen?Math.atan2(p.lastSeen.y-t.y,p.lastSeen.x-t.x):t.angle;
      const change=wrapAngle(angle-t.turret);t.turret+=Math.sign(change)*Math.min(Math.abs(change),2.8*dt);
    }
  }
}
