import { ARENA } from '../types';
import type { Level, PlayerCount, Spawn, Vec } from '../types';
import { circleBox } from '../CollisionManager';
import { lateCampaignDifficulty } from '../Campaign';

export const ENEMY_CHAPTERS = [
  { name: 'Escuela de exploradores', kind: 'basic', first: 1 },
  { name: 'Patrullas y persecución', kind: 'patrol', first: 11 },
  { name: 'Fortificaciones y rebotes', kind: 'tactical', first: 21 },
  { name: 'Cacería y mando', kind: 'hunter', first: 31 },
] as const;
type Roster = readonly [number, number, number, number]; // gray / purple / sentinel / hunter
interface Plan { source: number; name?: string; roster: Roster; lesson: string; identity: string }
/** Forty tactical lessons, not four independent enemy-multiplication campaigns. */
export const CHAPTER_PLANS: readonly Plan[] = [
  {source:1,roster:[1,0,0,0],lesson:'Rodea la cobertura y alinea la torreta antes de disparar.',identity:'Una barrera central y dos flancos abiertos.'},
  {source:2,roster:[2,0,0,0],lesson:'Despeja una esquina y cambia de cobertura antes de ir a la otra.',identity:'Dos esquinas detrás de coberturas escalonadas.'},
  {source:3,name:'Paso central',roster:[2,0,0,0],lesson:'Cruza entre los muros y conserva el rodeo inferior para retirarte.',identity:'Dos muros alternados con un enlace central ancho.'},
  {source:4,roster:[3,0,0,0],lesson:'Practica un rebote desde cobertura; compara ese tiro con el rodeo directo.',identity:'Barreras desfasadas con un puesto de rebote y un rodeo directo más largo.'},
  {source:5,roster:[3,0,0,0],lesson:'Tres impactos rompen el corcho. Abre un atajo sin perder tu escudo.',identity:'Dos compuertas de corcho y rodeos permanentes.'},
  {source:6,name:'Orillas de madera',roster:[3,0,0,0],lesson:'Las cavidades bloquean orugas, no misiles. Cambia de orilla sin cruzar la salva.',identity:'Una franja de cavidades entre refugios escalonados.'},
  {source:7,roster:[4,0,0,0],lesson:'Elige una esquina y limpia su escolta antes de pasar a la siguiente cobertura.',identity:'Tres columnas separan un flanco alto y otro bajo.'},
  {source:8,roster:[4,0,0,0],lesson:'Lee la siguiente salida antes de avanzar por la escalera de coberturas.',identity:'Corredores alternados con una escalera central y un anillo exterior.'},
  {source:9,roster:[4,0,0,0],lesson:'Aísla un sector del cruce; rompe el corcho solo cuando controles sus dos lados.',identity:'Cuatro refugios y una bisagra de corcho alrededor del cruce.'},
  {source:10,roster:[5,0,0,0],lesson:'Examen de exploradores: flancos, rebotes y dos puertas. Conquista una mitad antes de abrir la otra.',identity:'Muros escalonados y dos compuertas que enlazan los sectores del taller.'},
  {source:11,name:'Primera patrulla',roster:[3,1,0,0],lesson:'Un solo patrullero debuta. Adelanta el tiro, esquiva su rebote y conserva la bifurcación como retirada.',identity:'Una bifurcación alta y baja con una retirada central.'},
  {source:12,roster:[2,2,0,0],lesson:'Dos patrulleros vigilan el zigzag. Cruza cuando uno dispare y cambia de esquina antes del siguiente tiro.',identity:'Un zigzag desde el norte, una salida inferior y cavidades fuera del paso mínimo.'},
  {source:13,roster:[2,3,0,0],lesson:'Tres patrulleros rodean las eles. Abre una compuerta por vez y usa la otra como escudo.',identity:'Dos refugios en L con compuertas que cambian los ángulos de combate.'},
  {source:14,roster:[2,3,0,0],lesson:'Rompe un brazo de la pinza y atrae la patrulla hacia el terreno ganado.',identity:'Una pinza vertical con escapes por arriba y abajo.'},
  {source:15,roster:[1,4,0,0],lesson:'Cuatro patrulleros recorren las islas. Cambia de circuito antes de quedar atrapado contra una cavidad.',identity:'Cuatro islas y una zona central transitable por sus dos bordes.'},
  {source:26,name:'Doble compuerta',roster:[2,4,0,0],lesson:'Las patrullas también usan las puertas que abras. Conquista el primer sector y conserva un rodeo exterior.',identity:'Dos compuertas en serie dividen el combate en tres sectores.'},
  {source:17,roster:[2,4,0,0],lesson:'Asómate, atrae una patrulla y retrocede por la diagonal conocida antes de cambiar el ángulo.',identity:'Dos esquinas en L y una retirada diagonal fuera de la emboscada.'},
  {source:18,roster:[1,5,0,0],lesson:'Cinco patrulleros defienden ambas fortalezas. Concentra el avance sin perder el enlace entre ellas.',identity:'Dos fortalezas con compuertas y un cruce de cavidades.'},
  {source:19,roster:[1,5,0,0],lesson:'Abre el cerco por un sector. Atrae la patrulla a una entrada y contraataca por la otra.',identity:'Un anillo incompleto con dos entradas laterales.'},
  {source:20,roster:[1,6,0,0],lesson:'Examen de patrullas: separa las salvas, conquista una puerta y reagrúpate antes de avanzar.',identity:'Dos compuertas encadenadas y corredores exteriores para cambiar de frente.'},
  {source:31,name:'Primer centinela',roster:[1,4,1,0],lesson:'Un solo centinela debuta en el bastión. Provoca su intercepción y cambia de flanco durante su recarga.',identity:'Dos muros verticales y una bisagra baja protegen un puesto de rebote.'},
  {source:22,roster:[1,2,2,0],lesson:'Dos centinelas vigilan las pilas. Aísla uno detrás de la caja y ataca cuando haya gastado su misil.',identity:'Tres pilas escalonadas forman una cadena de refugios y dos circuitos.'},
  {source:23,roster:[0,3,2,0],lesson:'Las patrullas cubren el cruce entre las dos torretas. Avanza por relevos de cobertura tras cada salva.',identity:'Tres dientes alternados y una compuerta lateral con salidas exteriores.'},
  {source:24,roster:[1,1,3,0],lesson:'Tres centinelas rodean la bisagra. Gana un extremo antes de romper el corcho que abre la diagonal.',identity:'Cuatro apoyos alrededor de una bisagra destructible.'},
  {source:25,roster:[0,2,3,0],lesson:'Provoca una defensa desde un refugio y dispara desde otro. No abras dos ángulos enemigos a la vez.',identity:'Cuatro refugios separados por un corredor central de rotación.'},
  {source:16,roster:[0,0,3,0],lesson:'Galería restringida: provoca la intercepción y devuelve una salva con rebote. Las cavidades cierran tu zona de tiro.',identity:'Una barrera de movimiento deja pasar los misiles y obliga a atacar con rebotes.'},
  {source:27,roster:[1,1,4,0],lesson:'Cuatro centinelas fijan el anillo. Cambia de entrada mientras la patrulla guarda el enlace.',identity:'Un anillo con dos entradas enfrentadas y una bisagra interior.'},
  {source:28,roster:[0,2,4,0],lesson:'Las eles cortan la visión de las defensas. Cambia de diagonal después de cada tiro para evitar la respuesta.',identity:'Dos eles opuestas y una unión central destructible.'},
  {source:29,roster:[0,2,4,0],lesson:'Ataca desde una ventana, retrocede durante la respuesta y abre la siguiente cuando domines la retirada.',identity:'Columnas desfasadas y dos ventanas de corcho conectan los sectores.'},
  {source:36,name:'Cinco vigías',roster:[1,1,5,0],lesson:'Examen de centinelas: cinco vigías, cinco ángulos. Desarma un sector con señuelos y rebotes antes de entrar al siguiente.',identity:'Cinco puestos de observación separados por columnas y un techo central.'},
  {source:21,name:'Primer cazador',roster:[0,2,2,1],lesson:'Un solo cazador debuta. Busca tu flanco y bloquea un tiro: provoca su contratiro y ataca durante su recuperación.',identity:'Una pieza central divide dos líneas de corte, con escapes por el norte y el sur.'},
  {source:32,roster:[1,2,2,1],lesson:'El cazador usa el callejón y las patrullas guardan las salidas. Abre una retirada antes de atraerlo.',identity:'Un callejón de tres tramos, una compuerta inicial y dos rodeos permanentes.'},
  {source:33,roster:[0,2,2,2],lesson:'Dos cazadores cubren cruces distintos. Aísla uno detrás de la madera antes de cambiar de refugio.',identity:'Tres cruces escalonados con bordes exteriores para escapar.'},
  {source:34,roster:[0,1,3,2],lesson:'Gana un brazo de la tenaza; atrae allí a un cazador sin exponerte al otro ni a las torretas.',identity:'Una pinza desfasada, un refugio inicial y dos escapes opuestos.'},
  {source:35,roster:[0,0,4,2],lesson:'Mantén una compuerta como escudo mientras atacas por la otra. Los dos cazadores pueden cambiar de sector.',identity:'Una ciudadela de dos compuertas y refugios en L.'},
  {source:30,name:'Tres flancos',roster:[0,1,2,3],lesson:'Tres cazadores disputan los enlaces. Concentra el ataque en uno y cambia de sector durante su recuperación.',identity:'Tres sectores con corredores exteriores para enlazar cada conquista.'},
  {source:37,roster:[0,2,2,3],lesson:'Los dientes cortan la visión de los cazadores. Cambia de carril y evita volver a la última esquina que te vieron.',identity:'Una sierra de columnas alternadas con enlaces altos y bajos.'},
  {source:38,roster:[0,1,3,3],lesson:'Aísla una mitad del nudo. Conserva una salida exterior para que las cavidades no te encierren contra el cazador.',identity:'Dos eles enfrentadas y una ventana de corcho alrededor del nudo.'},
  {source:39,roster:[0,1,3,3],lesson:'Conquista una compuerta para separar a los cazadores. Despeja un sector antes de abrir el siguiente.',identity:'Dos compuertas en serie y cuatro sectores de asedio.'},
  {source:40,roster:[0,1,3,3],lesson:'Examen de mando: separa a los cazadores, provoca las defensas y conquista tres sectores con una retirada preparada.',identity:'Tres sectores enlazados y una compuerta transversal opcional.'},
];
export function chapterRoster(id: number, count: PlayerCount): Roster {
  const base = CHAPTER_PLANS[id - 1].roster;
  if (id === 26) return [0, 0, count === 1 ? 3 : count === 4 ? 5 : 4, 0];
  const extra = id <= 30 || id === 31 ? count - 1 : count === 1 ? 0 : count;
  const result = [...base] as [number, number, number, number];
  if (id <= 10) result[0] += extra;
  else if (id <= 20) {
    result[0] += extra;
    const limit = [0, 7, 8, 8, 9][count];
    result[0] -= Math.max(0, result.reduce((a,b)=>a+b,0) - limit);
  } else {
    const sentinels = id <= 30 ? (id >= 27 && count >= 3 ? 1 : 0) : id === 31 ? 0 : count === 4 ? 2 : count >= 2 ? 1 : 0;
    result[2] += Math.min(sentinels, 5 - result[2]);
    result[1] += extra - (result[2] - base[2]);
  }
  return result;
}
/** Undo only the original authored transform; new mission numbers never scale geometry twice. */
function transform(source: number, count: PlayerCount) {
  if (count === 1) return { scale: 1, staging: 0 };
  if (count === 2) return { scale: source === 16 ? 1.06 : source <= 10 ? 1.12 : source <= 20 ? 1.16 : source <= 30 ? 1.18 : 1.2, staging: source === 16 ? 0 : 120 };
  if (source === 21) return { scale: count === 3 ? 1.24 : 1.28, staging: 160 };
  if (source === 16) return { scale: count === 3 ? 1.12 : 1.22, staging: count === 3 ? 230 : 250 };
  return { scale: source <= 20 ? (count === 3 ? 1.22 : 1.3) + (source > 10 ? .04 : 0) : (count === 3 ? 1.28 : 1.38) + (source > 30 ? .02 : 0), staging: count === 3 ? 340 : 400 };
}
const extras: Readonly<Record<number, readonly Vec[]>> = {
  7: [{x:1120,y:430}],
  13: [{x:1040,y:570}],
  14: [{x:900,y:520}],
  15: [{x:1100,y:350}],
  17: [{x:1120,y:240}],
  18: [{x:900,y:540}],
  19: [{x:1040,y:300}],
  21: [{x:820,y:140},{x:820,y:520},{x:730,y:120},{x:700,y:500},{x:1070,y:330},{x:1120,y:430}],
  32: [{x:1040,y:430}],
  34: [{x:1120,y:330}],
  37: [{x:1040,y:400}],
  38: [{x:1120,y:300}],
  39: [{x:1130,y:440}],
};
export function buildChapterCampaign(templates: Record<PlayerCount, Level[]>, count: PlayerCount): Level[] {
  return CHAPTER_PLANS.map((plan, i) => {
    const id = i + 1, template = templates[count][plan.source - 1], {scale, staging} = transform(plan.source, count);
    // A deeper duo deployment prevents a nearby wall from returning an opening shot into its owner.
    // Players keep their distinct rows; terrain, posts and rally move together, with no physics change.
    const bay = count === 2 && !template.bankShotOnly ? 240 : 0;
    const translate = (p:Vec):Vec=>({x:p.x+bay,y:p.y});
    const source:Level=bay?{...template,arena:{...(template.arena??ARENA),w:(template.arena??ARENA).w+bay},
      obstacles:template.obstacles.map(o=>({...o,...translate(o)})),holes:template.holes?.map(h=>({...h,...translate(h)})),enemies:template.enemies.map(s=>({...s,...translate(s)})),
      design:{...template.design!,routes:template.design!.routes.map(r=>({...r,points:r.points.map(translate)})),
        cooperation:{...template.design!.cooperation!,rally:translate(template.design!.cooperation!.rally)},
        ...(template.design!.bankTargets?{bankTargets:template.design!.bankTargets.map(b=>({...b,from:translate(b.from)}))}:{})}}:template;
    const point = (p: Vec): Vec => ({x: ARENA.x + staging + bay + (p.x - ARENA.x) * scale, y: ARENA.y + (p.y - ARENA.y) * scale});
    const playerSpawns=source.playerSpawns?.map(p=>({...p}));
    if(id===31&&count===4)playerSpawns![1]=point({x:440,y:270});
    const original = (p: Vec, c: PlayerCount): Vec => {const t=transform(plan.source,c);return {x:ARENA.x+(p.x-ARENA.x-t.staging)/t.scale,y:ARENA.y+(p.y-ARENA.y)/t.scale};};
    const roster=chapterRoster(id,count), total=roster.reduce((a,b)=>a+b,0);
    const candidates: Spawn[] = [...source.enemies];
    for (const c of [1,2,3,4] as const) for (const s of templates[c][plan.source-1].enemies) {
      const p=point(original(s,c)); if(!candidates.some(v=>Math.hypot(v.x-p.x,v.y-p.y)<30))candidates.push({...p,kind:s.kind});
    }
    for(const p of extras[plan.source]??[])candidates.push({...point(p),kind:'basic'});
    const bounds=source.arena??ARENA, selected: Spawn[]=[];
    const free=(s:Spawn)=>s.x>=bounds.x+20&&s.y>=bounds.y+20&&s.x<=bounds.x+bounds.w-20&&s.y<=bounds.y+bounds.h-20&&
      !source.obstacles.some(o=>circleBox(s,20,o))&&!source.holes?.some(h=>Math.hypot(s.x-h.x,s.y-h.y)<h.radius+20)&&
      !(playerSpawns??[source.player]).some(p=>Math.hypot(s.x-p.x,s.y-p.y)<(count<=2?295:400))&&
      !selected.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<44)&&!source.design!.routes.some(r=>r.points.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<40));
    // Keep named ricochet targets, then reviewed sector posts, then explicit support sites.
    for(const bank of source.design!.bankTargets??[]) {
      const s=source.enemies[bank.enemy];if(s&&!selected.includes(s))selected.push(s);
    }
    for(const s of candidates)if(selected.length<total&&!selected.includes(s)&&free(s))selected.push(s);
    if(selected.length!==total)throw new Error(`Missing sector posts ${id}/${count}: ${selected.length}/${total}`);
    const kinds=['basic','patrol','tactical','hunter'] as const, remaining=[...roster], assigned=new Map<Spawn, Spawn['kind']>();
    for(const k of [3,2,1,0])for(const s of selected)if(!assigned.has(s)&&s.kind===kinds[k]&&remaining[k]>0){assigned.set(s,kinds[k]);remaining[k]--;}
    for(const k of [3,2,1,0])for(const s of selected)if(!assigned.has(s)&&remaining[k]>0){assigned.set(s,kinds[k]);remaining[k]--;}
    const enemies=selected.map(s=>({...s,kind:assigned.get(s)!}));
    const roles=source.design!.cooperation?.roles.map(r=>r.replace(/centinela|cazador|patrullero/g,'enemigo'));
    const lesson=count===1?plan.lesson:`${plan.lesson} Alternen el avance y la cobertura; avisen antes de cruzar los carriles de fuego amigo.`;
    return {...source,id,name:plan.name??source.name,difficulty:templates[1][i]?.difficulty??lateCampaignDifficulty(id),subtitle:lesson,enemies,
      ...(playerSpawns?{playerSpawns,player:playerSpawns[0]}:{}),
      design:{...source.design!,lesson,identity:plan.identity,
        changes:`Capítulo ${Math.ceil(id/10)}: puestos revisados para ${count} ${count===1?'jugador':'jugadores'}, con ${roster.join('/')} exploradores/patrulleros/centinelas/cazadores. ${plan.lesson}`,
        progression:{chapter:Math.ceil(id/10),sourceId:plan.source,introduced:ENEMY_CHAPTERS[Math.min(Math.floor(i/10),ENEMY_CHAPTERS.length-1)].kind},
        ...(roles?{cooperation:{...source.design!.cooperation!,roles},routes:source.design!.routes.map(r=>({...r,name:roles[(r.player??1)-1]}))}:{}),
        ...(source.design!.bankTargets?{bankTargets:source.design!.bankTargets.map(b=>({...b,enemy:selected.indexOf(source.enemies[b.enemy])}))}:{}),
      }};
  });
}
