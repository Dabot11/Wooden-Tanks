import { ARENA } from '../types';
import type { Level, PlayerCount, Vec } from '../types';
/** Only mission 21 is authored here; the broader 3/4-player review remains a separate task. */
export function hunterPartyDebut(source:Level,count:3|4):Level {
  const scale=count===3?1.24:1.28,staging=160;
  const point=(p:Vec):Vec=>({x:ARENA.x+staging+(p.x-ARENA.x)*scale,y:ARENA.y+(p.y-ARENA.y)*scale});
  const starts=count===3?[{x:140,y:130},{x:140,y:530},{x:430,y:330}]:[{x:140,y:100},{x:400,y:250},{x:140,y:410},{x:400,y:560}];
  const roles=count===3?['P1 · señuelo por el norte','P2 · proteger el rodeo sur','P3 · vigilar el enlace central']:['P1 · vigilar el borde norte','P2 · atraer desde el enlace alto','P3 · cubrir el flanco bajo','P4 · proteger la retirada sur'];
  const destinations=count===3?[{x:850,y:110},{x:850,y:550},{x:710,y:300}]:[{x:850,y:110},{x:710,y:220},{x:700,y:500},{x:980,y:580}];
  const playerSpawns=starts.map(point);
  return {...source,arena:{...ARENA,w:ARENA.w*scale+staging,h:ARENA.h*scale},playerSpawns,player:playerSpawns[0],
    enemies:[...source.enemies,{x:1070,y:330,kind:'patrol' as const}].map(e=>({...e,...point(e)})),
    obstacles:source.obstacles.map(o=>({...o,...point(o),w:o.w*scale,h:o.h*scale})),holes:source.holes?.map(h=>({...point(h),radius:h.radius*scale})),
    subtitle:'Un solo cazador, cuatro enemigos. El señuelo provoca su contratiro; ataquen desde otro flanco mientras recarga.',
    design:{...source.design!,lesson:'Releven al señuelo y mantengan libres las salidas del equipo.',changes:'Cuatro posiciones enemigas explícitas; el cazador conserva un misil activo para que su debut sea legible con todo el equipo.',
      cooperation:{roles,rally:point({x:800,y:330})},routes:starts.map((p,i)=>({name:roles[i],player:(i+1)as PlayerCount,points:[point({x:p.x,y:p.y<330?90:580}),point(destinations[i])]}))},
  };
}
/** Two covers and one hunter; shared campaign save data is isolated by Session.practice. */
export function hunterTrial(source:Level):Level {
  return {...source,name:'Encuentro con el cazador',subtitle:'Esquiva disparos visibles y puede bloquear uno con su misil. Provoca su contratiro y ataca desde otro ángulo durante la recuperación.',
    obstacles:[source.obstacles[0],source.obstacles[2]],holes:[],enemies:source.enemies.filter(e=>e.kind==='hunter')};
}
