import { enemyProfile } from './EnemyProfiles';
import type { Tank, TankKind, Vec } from './types';
export function createTank(id: number, kind: TankKind, position: Vec): Tank {
  return { ...position, id, kind, alive: true, angle: -Math.PI / 2, turret: -Math.PI / 2,
    radius: 19, cooldown: kind === 'player' ? 0 : enemyProfile(kind).cooldown + (id % 3) * 0.2,
    state: 'Idle', think: 0.3 + id * 0.15, goal: { ...position }, path: [],
    pathTime: 0, shots: 0, distance: 0 };
}
export const TANK_COLORS: Record<TankKind, number> = {
  player: 0x258db2, basic: 0x81868a, patrol: 0x82659b, tactical: 0xd9ceaa, hunter: 0x42454a,
};
