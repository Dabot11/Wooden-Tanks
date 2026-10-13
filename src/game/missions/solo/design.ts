import type { Level, Vec, MissionDesign, TacticalRoute } from '../../types';
import { ARENA } from '../../types';
export type SoloDesign = MissionDesign;
export type { TacticalRoute } from '../../types';
export interface SoloRevision extends Omit<Level, 'name' | 'difficulty'> { design: SoloDesign }
export const at = (x: number, y: number): Vec => ({ x, y });
// Tactical posts use the navigation clearance grid so the displayed paths are executable.
export const post = (x: number, y: number): Vec => ({ x: ARENA.x + (Math.round((x - ARENA.x) / 38 - .5) + .5) * 38, y: ARENA.y + (Math.round((y - ARENA.y) / 38 - .5) + .5) * 38 });
export const route = (name: string, ...points: [number, number][]): TacticalRoute => ({ name, points: points.map(([x, y]) => post(x, y)) });
export const hole = (x: number, y: number, radius = 15) => ({ x, y, radius });
export function revise(id: number, player: Vec, obstacles: Level['obstacles'], enemies: Level['enemies'], design: SoloDesign, holes: Level['holes'] = [], bankShotOnly = false): SoloRevision {
  return { id, subtitle: design.lesson, player, obstacles, enemies, design, holes, bankShotOnly };
}
