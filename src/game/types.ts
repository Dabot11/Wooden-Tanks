export interface Vec { x: number; y: number }
export interface PlayerInput { move: Vec; aim: Vec; fire: boolean }
export interface Rect extends Vec { w: number; h: number }
export interface Hole extends Vec { radius: number }
export type TankKind = 'player' | 'basic' | 'patrol' | 'offensive' | 'tactical';
export type AIState = 'Idle' | 'Patrol' | 'Chase' | 'Aim' | 'Shoot' | 'Evade' | 'Reposition';
export interface Tank extends Vec {
  id: number; kind: TankKind; alive: boolean; angle: number; turret: number;
  radius: number; cooldown: number; state: AIState; think: number;
  goal: Vec; path: Vec[]; pathTime: number; shots: number; distance: number;
}
export interface Projectile extends Vec {
  id: number; owner: number; vx: number; vy: number; age: number;
  bounces: number; alive: boolean;
}
export interface Obstacle extends Rect { id: number; destructible: boolean; hp: number; alive: boolean }
export interface Spawn extends Vec { kind: Exclude<TankKind, 'player'> }
export interface Level { id: number; name: string; subtitle: string; obstacles: (Rect & { destructible?: boolean })[]; holes?: Hole[]; player: Vec; enemies: Spawn[]; difficulty: number }
export type CombatEvent =
  | { type: 'shot'; x: number; y: number; angle: number; player: boolean }
  | { type: 'bounce' | 'impact' | 'break'; x: number; y: number }
  | { type: 'destroy'; x: number; y: number; player: boolean; kind: TankKind };
export const ARENA: Rect = { x: 48, y: 44, w: 1184, h: 578 };
export const WIDTH = 1280;
export const HEIGHT = 720;
export const SHOT_LIMIT = 5;
export const SPEED_SCALE = 0.75;
export const SHOT_SPEED = 430 * SPEED_SCALE;
export const TANK_SPEED = 155 * SPEED_SCALE;
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
export const lerpAngle = (from: number, to: number, t: number) => from + wrapAngle(to - from) * Math.min(1, t);
