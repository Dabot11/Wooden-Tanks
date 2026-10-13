import { ARENA } from '../../types';
import type { Level, Vec } from '../../types';
export interface DuoPlan {
  id: number;
  starts: [Vec, Vec];
  extras: Level['enemies'];
  cover: Level['obstacles'];
  lesson: string;
  roles: [string, string];
  changes: string;
  rally: Vec;
  routeOrder?: [number, number];
  bankTargets?: {from:Vec;enemy:number}[];
}
export const at = (x: number, y: number): Vec => ({ x, y });
/** Bake a reviewed formation into world coordinates. World must not scale it or add waves again. */
export function authorDuo(source: Level, plan: DuoPlan): Level {
  const scale = plan.id === 16 ? 1.06 : plan.id <= 10 ? 1.12 : plan.id <= 20 ? 1.16 : plan.id <= 30 ? 1.18 : 1.2;
  const staging = plan.id === 16 ? 0 : 120;
  const point = (p: Vec): Vec => ({ x: ARENA.x + staging + (p.x - ARENA.x) * scale, y: ARENA.y + (p.y - ARENA.y) * scale });
  const arena = { ...ARENA, w: ARENA.w * scale + staging, h: ARENA.h * scale };
  const cell = (value:number,extent:number) => Math.max(1,Math.min(Math.floor((extent-20)/38-.5),Math.round(value/38-.5)));
  const post = (p: Vec): Vec => plan.id === 16 ? p : ({ x: arena.x + (cell(p.x-arena.x,arena.w)+.5)*38, y: arena.y + (cell(p.y-arena.y,arena.h)+.5)*38 });
  const playerSpawns = plan.starts.map(point);
  const banks=plan.bankTargets ?? source.design!.bankTargets;
  return {
    ...source, arena, playerSpawns, player: playerSpawns[0], subtitle: plan.lesson,
    obstacles: [...source.obstacles, ...plan.cover].map(o => ({ ...o, ...point(o), w:o.w*scale, h:o.h*scale })),
    holes: source.holes?.map(h => ({ ...point(h), radius:h.radius*scale })),
    enemies: [...source.enemies, ...plan.extras].map(e => ({ ...e, ...point(e) })),
    design: {
      lesson:plan.lesson, identity:source.design!.identity, changes:plan.changes,
      cooperation:{ roles:plan.roles, rally:point(plan.rally) },
      routes:(plan.routeOrder ?? [0,1]).map((routeIndex,i) => ({ name:plan.roles[i], player:(i+1) as 1|2, points:source.design!.routes[routeIndex].points.map(p=>post(point(p))) })),
      ...(banks ? {bankTargets:banks.map(b => ({ ...b, from:point(b.from) }))} : {}),
    },
  };
}
