import { TANK_SPEED, SHOT_SPEED, wrapAngle } from './types';
import type { Tank, Vec } from './types';
import type { World } from './World';
import { lineClear } from './CollisionManager';
import { findPath, bankAngle } from './Navigation';
export const HUNTER = { speed:TANK_SPEED*.8, windup:.65, recovery:.65, memory:2, commitment:2.8, cooldown:2.8 } as const;
interface Plan { targetId:number|null; lastSeen?:Vec; memory:number; commitment:number; decision:number; phaseTime:number; angle:number|null; stuck:number; search:number }
const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y);
const position=(p:Vec):Vec=>({x:p.x,y:p.y});
/** A committed flanker with finite sight memory, fixed telegraphed aim and one ordinary shell. */
export class HunterAI {
  private plans=new Map<number,Plan>();
  private shotAngle(w:World,t:Tank,target:Vec):number|null {
    return lineClear(t,target,w.solids,5)?Math.atan2(target.y-t.y,target.x-t.x):bankAngle(t,target,w.solids,SHOT_SPEED*6.8);
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
  update(w:World,t:Tank,dt:number) {
    let p=this.plans.get(t.id);
    if(!p){p={targetId:null,memory:0,commitment:0,decision:0,phaseTime:.4,angle:null,stuck:0,search:t.id%4};this.plans.set(t.id,p);t.state='Observe';}
    p.commitment-=dt;p.decision-=dt;p.phaseTime-=dt;
    let target=w.alivePlayers.find(player=>player.id===p!.targetId);
    if(!target){p.targetId=null;p.memory=0;}
    if(!target||(p.commitment<=0&&t.state!=='Windup')){
      const visible=this.chooseTarget(w,t);
      if(visible){
        if(visible.id!==p.targetId){t.path=[];t.state='Observe';p.phaseTime=.4;p.decision=0;p.angle=null;}
        target=visible;p.targetId=visible.id;p.commitment=HUNTER.commitment;
      }
    }
    if(target&&lineClear(t,target,w.solids,5)){p.lastSeen=position(target);p.memory=HUNTER.memory;}
    else p.memory=Math.max(0,p.memory-dt);
    if(!p.memory){p.targetId=null;p.lastSeen=undefined;}
    t.hunter={targetId:p.targetId,...(p.lastSeen?{lastSeen:position(p.lastSeen)}:{}),memory:p.memory,charge:t.state==='Windup'?Math.min(1,1-p.phaseTime/HUNTER.windup):0};
    if(t.state==='Observe'&&p.phaseTime>0)return;
    if(t.state==='Windup'){
      if(!p.lastSeen||p.angle===null){t.state='Search';p.decision=0;return;}
      const change=wrapAngle(p.angle-t.turret);t.turret+=Math.sign(change)*Math.min(Math.abs(change),3.6*dt);
      if(p.phaseTime<=0&&Math.abs(wrapAngle(p.angle-t.turret))<.07){
        if(w.fire(t)){t.state='Recover';p.phaseTime=HUNTER.recovery;t.hunter.charge=0;p.decision=0;}
        else {t.state='Flank';p.decision=0;}
      }
      return;
    }
    if(t.state==='Recover'&&p.phaseTime>0)return;
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
