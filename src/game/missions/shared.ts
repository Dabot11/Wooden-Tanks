import type { Level, Rect, Spawn, Hole } from '../types';
export const block = (x: number, y: number, w = 44, h = 88, destructible = false) => ({ x, y, w, h, destructible });
export const boardHoles: Hole[] = [
  { x: 156, y: 415, radius: 15 }, { x: 198, y: 415, radius: 15 }, { x: 240, y: 415, radius: 15 },
  { x: 562, y: 572, radius: 15 }, { x: 562, y: 604, radius: 15 },
  { x: 1030, y: 342, radius: 15 }, { x: 1075, y: 342, radius: 15 }, { x: 1120, y: 342, radius: 15 },
];

export const enemy = (x: number, y: number, kind: Spawn['kind']): Spawn => ({ x, y, kind });
export const mission = (id: number, name: string, subtitle: string, obstacles: (Rect & { destructible?: boolean })[], enemies: Spawn[], difficulty: number, holes: Hole[] = boardHoles): Level =>
  ({ id, name, subtitle, obstacles, holes, enemies, difficulty, player: { x: 180, y: 520 } });
