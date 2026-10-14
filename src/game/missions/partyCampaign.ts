import { ARENA } from '../types';
import type { Level, Vec, Spawn, PlayerCount } from '../types';
import { enemy as e } from './shared';

/** Reviewed support posts, in the same source coordinates as the solo/duo layouts. */
export const PARTY_SUPPORT: Readonly<Record<number,readonly [Spawn,Spawn]>> = {
  22:[e(650,250,'basic'),e(1090,330,'patrol')],
  23:[e(840,500,'patrol'),e(920,160,'basic')],
  24:[e(890,550,'patrol'),e(900,130,'basic')],
  25:[e(1100,380,'patrol'),e(920,130,'basic')],
  26:[e(1090,350,'patrol'),e(940,140,'basic')],
  27:[e(900,520,'patrol'),e(1090,280,'basic')],
  28:[e(900,550,'basic'),e(960,490,'patrol')],
  29:[e(1060,410,'patrol'),e(700,350,'patrol')],
  30:[e(700,300,'patrol'),e(920,140,'basic')],
  31:[e(690,550,'patrol'),e(900,120,'basic')],
  32:[e(1110,380,'patrol'),e(730,570,'basic')],
  33:[e(630,530,'patrol'),e(700,270,'patrol')],
  34:[e(1120,390,'patrol'),e(740,530,'patrol')],
  35:[e(730,250,'hunter'),e(850,120,'patrol')],
  36:[e(1110,400,'patrol'),e(740,450,'hunter')],
  37:[e(730,550,'patrol'),e(650,420,'patrol')],
  38:[e(1100,260,'patrol'),e(450,140,'patrol')],
  39:[e(710,400,'patrol'),e(930,140,'hunter')],
  40:[e(730,340,'patrol'),e(990,130,'hunter')],
};

/** Larger staging terrain and complementary lanes; never multiply the whole opposing formation. */
export function authorParty(source:Level,duo:Level,count:3|4):Level {
  const support=PARTY_SUPPORT[source.id];
  if(!support)throw new Error(`Missing party formation for mission ${source.id}`);
  const scale=(count===3?1.28:1.38)+(source.id>30?.02:0),staging=count===3?340:400;
  const point=(p:Vec):Vec=>({x:ARENA.x+staging+(p.x-ARENA.x)*scale,y:ARENA.y+(p.y-ARENA.y)*scale});
  const arena={...ARENA,w:ARENA.w*scale+staging,h:ARENA.h*scale};
  // Undo the baked duo transform once, then author the larger arena once. Cover identity stays shared.
  const duoScale=source.id<=30?1.18:1.2;
  const raw=(p:Vec):Vec=>({x:ARENA.x+(p.x-ARENA.x-120)/duoScale,y:ARENA.y+(p.y-ARENA.y)/duoScale});
  const cell=(value:number,extent:number)=>Math.max(1,Math.min(Math.floor((extent-20)/38-.5),Math.round(value/38-.5)));
  const post=(p:Vec):Vec=>({x:arena.x+(cell(p.x-arena.x,arena.w)+.5)*38,y:arena.y+(cell(p.y-arena.y,arena.h)+.5)*38});
  const starts=count===3?[{x:-90,y:90},{x:-90,y:330},{x:-90,y:570}]:[{x:-130,y:100},{x:40,y:250},{x:-130,y:410},{x:40,y:570}];
  const playerSpawns=starts.map(point),team=duo.design!.cooperation!;
  const high=team.roles[0].replace(/^P1 · /,''),low=team.roles[1].replace(/^P2 · /,'');
  const roles=count===3?[`P1 · ${high}`,'P2 · relevo central y señuelo',`P3 · ${low}`]:[`P1 · ${high}`,'P2 · apoyo alto y relevo del señuelo','P3 · enlace bajo y cobertura de retirada',`P4 · ${low}`];
  const highPath=source.design!.routes[0].points.map(p=>({...p})),lowPath=source.design!.routes[1].points.map(p=>({...p}));
  // Larger grids need explicit posts clear of the bastion escort and the western retreat cover.
  if(source.id===31){if(count===3)lowPath[1]={x:750,y:570};else highPath[1]={x:620,y:90};}
  if(count===4&&[32,37,39].includes(source.id))lowPath[0]={x:260,y:590};
  if(count===3&&source.id===35)lowPath[0]={x:400,y:590};
  const paths=count===3?[highPath,highPath.slice(0,-1),lowPath]:[highPath,highPath.slice(0,-1),lowPath.slice(0,-1),lowPath];
  const lesson=source.id===23?'El zigzag da una pausa de cazadores. Avancen por relevos y mantengan separados los carriles de tiro.':`${count} frentes coordinados: alternen el señuelo y aprovechen la recarga; avisen antes de cruzar las líneas de fuego.`;
  return {...source,arena,playerSpawns,player:playerSpawns[0],subtitle:lesson,
    obstacles:duo.obstacles.map(o=>({...o,...point(raw(o)),w:o.w/duoScale*scale,h:o.h/duoScale*scale})),
    holes:source.holes?.map(h=>({...point(h),radius:h.radius*scale})),
    enemies:[...duo.enemies.map(s=>({...s,...raw(s)})),...support.slice(0,count-2)].map(s=>({...s,...point(s)})),
    design:{...source.design!,lesson,changes:`${duo.enemies.length+count-2} enemigos con puestos explícitos. Se conserva la identidad del mapa y se amplía el despliegue occidental; ${count-2} apoyos vigilan conexiones concretas.`,
      cooperation:{roles,rally:point(raw(team.rally))},
      routes:paths.map((points,i)=>({name:roles[i],player:(i+1) as PlayerCount,points:[post(point({x:120,y:starts[i].y})),...points.map(p=>post(point(p)))]})),
      ...(duo.design!.bankTargets?{bankTargets:duo.design!.bankTargets.map(b=>({...b,from:point(raw(b.from))}))}:{}),
    },
  };
}
