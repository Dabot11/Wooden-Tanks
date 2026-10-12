import type { Level, PlayerCount, Tank, Vec } from './types';
export const DUEL_TARGET = 3;
export function duelResult(players: readonly Tank[]): number | null | undefined {
  const alive = players.flatMap((p, i) => p.alive ? [i] : []);
  return alive.length > 1 ? undefined : alive.length === 1 ? alive[0] : null;
}
export function duelSpawns(count: PlayerCount): Vec[] {
  if (count === 2) return [{ x: 180, y: 180 }, { x: 1100, y: 520 }];
  if (count === 3) return [{ x: 640, y: 150 }, { x: 882, y: 570 }, { x: 398, y: 570 }];
  return [{ x: 180, y: 180 }, { x: 1100, y: 520 }, { x: 1100, y: 180 }, { x: 180, y: 520 }];
}
export function duelLevel(round: number): Level {
  const maps = [
    [{ x: 520, y: 270, w: 80, h: 140 }, { x: 680, y: 270, w: 80, h: 140 }],
    [{ x: 360, y: 280, w: 160, h: 44 }, { x: 760, y: 280, w: 160, h: 44 }, { x: 600, y: 400, w: 80, h: 44, destructible: true }],
    [{ x: 440, y: 200, w: 44, h: 160 }, { x: 796, y: 200, w: 44, h: 160 }, { x: 580, y: 430, w: 120, h: 44 }],
  ];
  return { id: round, name: ['Arena del taller', 'Cruce de fuego', 'Tres coberturas'][(round - 1) % maps.length], subtitle: 'Todos contra todos · último tanque vivo · primero a tres victorias', obstacles: maps[(round - 1) % maps.length], holes: [], enemies: [], player: { x: 180, y: 520 }, difficulty: 1 };
}
