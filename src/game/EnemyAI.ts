import { enemyReloadScale } from './Campaign';
import { enemyProfile } from './EnemyProfiles';
import { ARENA, SPEED_SCALE, lerpAngle, wrapAngle } from './types';
import type { Tank, Vec, Rect } from './types';
import type { World } from './World';
import { circleBox, lineClear, sweepCircle } from './CollisionManager';
const CELL = 38;
/** Breadth-first navigation on a clearance grid; tank movement itself remains continuous. */
export function findPath(start: Vec, goal: Vec, boxes: Rect[], radius = 20, arena: Rect = ARENA): Vec[] {
  const COLS = Math.floor(arena.w / CELL), ROWS = Math.floor(arena.h / CELL);
  const center = (index: number): Vec => ({ x: arena.x + (index % COLS + 0.5) * CELL, y: arena.y + (Math.floor(index / COLS) + 0.5) * CELL });
  const free = Array.from({ length: COLS * ROWS }, (_, i) => !boxes.some(b => circleBox(center(i), radius + 2, b)));
  const nearest = (p: Vec) => {
    let best = -1, distance = Infinity;
    for (let i = 0; i < free.length; i++) if (free[i]) {
      const c = center(i), d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (d < distance) { distance = d; best = i; }
    }
    return best;
  };
  const from = nearest(start), to = nearest(goal);
  if (from < 0 || to < 0) return [];
  const parent = new Int32Array(free.length).fill(-1), queue = [from]; parent[from] = from;
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]; if (current === to) break;
    const x = current % COLS, y = Math.floor(current / COLS);
    const neighbors = [x > 0 ? current - 1 : -1, x < COLS - 1 ? current + 1 : -1, y > 0 ? current - COLS : -1, y < ROWS - 1 ? current + COLS : -1];
    for (const n of neighbors) if (n >= 0 && free[n] && parent[n] === -1) { parent[n] = current; queue.push(n); }
  }
  if (parent[to] < 0) return [];
  const path: Vec[] = []; let index = to;
  while (index !== from) { path.unshift(center(index)); index = parent[index]; }
  // Include the nearest start cell only if the direct first step would clip a corner.
  if (path.length && !lineClear(start, path[0], boxes, radius + 1)) path.unshift(center(from));
  while (path.length > 1 && lineClear(start, path[1], boxes, radius + 1)) path.shift();
  return path;
}
/** Mirror the target across one wall face, then validate both legs of the bank shot. */
export function bankAngle(from: Vec, target: Vec, boxes: Rect[], range = 1200): number | null {
  for (const box of boxes) {
    const faces = [
      { axis: 'x' as const, sign: -1, value: box.x - 4, min: box.y - 4, max: box.y + box.h + 4 },
      { axis: 'x' as const, sign: 1, value: box.x + box.w + 4, min: box.y - 4, max: box.y + box.h + 4 },
      { axis: 'y' as const, sign: -1, value: box.y - 4, min: box.x - 4, max: box.x + box.w + 4 },
      { axis: 'y' as const, sign: 1, value: box.y + box.h + 4, min: box.x - 4, max: box.x + box.w + 4 },
    ];
    for (const f of faces) {
      const axis = f.axis, other = axis === 'x' ? 'y' : 'x';
      if ((from[axis] - f.value) * f.sign <= 0 || (target[axis] - f.value) * f.sign <= 0) continue;
      const mirrored = { ...target, [axis]: 2 * f.value - target[axis] };
      const ratio = (f.value - from[axis]) / (mirrored[axis] - from[axis]);
      if (ratio <= 0 || ratio >= 1) continue;
      const hit = { x: from.x + (mirrored.x - from.x) * ratio, y: from.y + (mirrored.y - from.y) * ratio };
      if (hit[other] <= f.min + 8 || hit[other] >= f.max - 8) continue;
      const others = boxes.filter(b => b !== box);
      if (Math.hypot(hit.x - from.x, hit.y - from.y) + Math.hypot(hit.x - target.x, hit.y - target.y) > range) continue;
      if (lineClear(from, hit, others, 5) && lineClear(hit, target, others, 5)) return Math.atan2(hit.y - from.y, hit.x - from.x);
    }
  }
  return null;
}
/** Choose a nearby, reachable-size position whose line to the player is occluded. */
export function chooseCover(from: Vec, target: Vec, boxes: Rect[]): Vec | null {
  let result: Vec | null = null, best = Infinity;
  for (const box of boxes) {
    // Arena borders cannot provide interior cover.
    if (box.x < ARENA.x || box.y < ARENA.y || box.x + box.w > ARENA.x + ARENA.w || box.y + box.h > ARENA.y + ARENA.h) continue;
    const offset = 32;
    const points = [
      { x: box.x - offset, y: box.y + box.h / 2 },
      { x: box.x + box.w + offset, y: box.y + box.h / 2 },
      { x: box.x + box.w / 2, y: box.y - offset },
      { x: box.x + box.w / 2, y: box.y + box.h + offset },
    ];
    for (const point of points) {
      const travel = Math.hypot(point.x - from.x, point.y - from.y);
      const range = Math.hypot(point.x - target.x, point.y - target.y);
      if (travel < 30 || travel > 350 || range < 230 || range > 650) continue;
      if (boxes.some(b => circleBox(point, 22, b)) || lineClear(point, target, boxes, 4)) continue;
      const score = travel + Math.abs(range - 400) * 0.3;
      if (score < best) { best = score; result = point; }
    }
  }
  return result;
}
export class EnemyAI {
  private plans = new Map<number, { angle: number | null; move: Vec; reaction: number; stuck: number; cover: Vec | null; coverUntil: number; targetId: number }>();
  constructor(private random: () => number = Math.random) {}
  private sentinel(world: World, tank: Tank, player: Tank, dt: number) {
    tank.path = []; tank.goal = { x: tank.x, y: tank.y }; tank.state = 'Aim';
    // A real countershot consumes the same slow weapon cooldown as an attack.
    // Limited range, sight and turning leave salvos and late bank shots effective.
    const threat = world.projectiles.filter(p => p.alive && world.players.some(t => t.id === p.owner) &&
      Math.hypot(p.x - tank.x, p.y - tank.y) < 460 &&
      sweepCircle(p, { x: p.vx * 1.2, y: p.vy * 1.2 }, tank, tank.radius + 8) !== null && lineClear(tank, p, world.solids, 4))
      .sort((a, b) => Math.hypot(a.x - tank.x, a.y - tank.y) - Math.hypot(b.x - tank.x, b.y - tank.y))[0];
    let angle: number | null = null;
    if (threat) {
      const rx = threat.x - tank.x, ry = threat.y - tank.y, speed = enemyProfile(tank.kind).speed;
      const a = threat.vx ** 2 + threat.vy ** 2 - speed ** 2;
      const b = 2 * (rx * threat.vx + ry * threat.vy), c = rx ** 2 + ry ** 2;
      const discriminant = b * b - 4 * a * c;
      const time = discriminant >= 0 ? (-b - Math.sqrt(discriminant)) / (2 * a) : -1;
      if (time > 0) angle = Math.atan2(ry + threat.vy * time, rx + threat.vx * time);
    } else angle = lineClear(tank, player, world.solids, 5) ? Math.atan2(player.y - tank.y, player.x - tank.x) : bankAngle(tank, player, world.solids, Math.hypot(world.arena.w, world.arena.h) * 1.5);
    if (angle === null) return;
    const change = wrapAngle(angle - tank.turret), turn = 2.4 * dt;
    tank.turret += Math.max(-turn, Math.min(turn, change));
    if (Math.abs(wrapAngle(angle - tank.turret)) < 0.07) world.fire(tank);
  }
  update(world: World, tank: Tank, dt: number) {
    const player = world.alivePlayers.reduce<Tank | null>((nearest, candidate) => !nearest || Math.hypot(candidate.x - tank.x, candidate.y - tank.y) < Math.hypot(nearest.x - tank.x, nearest.y - tank.y) ? candidate : nearest, null);
    if (!player) return;
    const solids = world.solids, movementSolids = world.movementSolids;
    if (tank.kind === 'tactical') { this.sentinel(world, tank, player, dt); return; }
    let plan = this.plans.get(tank.id);
    if (!plan) { plan = { angle: null, move: { x: 0, y: 0 }, reaction: 0.7, stuck: 0, cover: null, coverUntil: 0, targetId: player.id }; this.plans.set(tank.id, plan); }
    if (plan.targetId !== player.id) { plan.targetId = player.id; tank.think = 0; tank.pathTime = 0; plan.cover = null; }
    tank.think -= dt; tank.pathTime -= dt; plan.reaction -= dt;
    if (tank.think <= 0) {
      tank.think = 0.25 + this.random() * 0.2;
      const clear = lineClear(tank, player, solids, 5);
      plan.angle = clear ? Math.atan2(player.y - tank.y, player.x - tank.x) : null;
      tank.state = tank.kind === 'basic' ? 'Idle' : tank.kind === 'patrol' ? 'Patrol' : 'Chase';
      if (tank.kind === 'basic') {
        if (clear) { tank.goal = { ...tank }; tank.state = 'Aim'; }
        else if (tank.pathTime <= 0) tank.goal = { ...player };
      } else if (tank.kind === 'patrol') {
        if (Math.hypot(tank.goal.x - tank.x, tank.goal.y - tank.y) < 45 || (tank.pathTime <= 0 && tank.path.length === 0)) {
          tank.goal = { x: world.arena.x + 70 + this.random() * (world.arena.w - 140), y: world.arena.y + 70 + this.random() * (world.arena.h - 140) };
          tank.pathTime = 0;
        }
      }
      if (tank.pathTime <= 0) {
        tank.path = findPath(tank, tank.goal, movementSolids, 20, world.arena);
        tank.pathTime = 0.9 + this.random() * 0.5;
      }
      const danger = world.projectiles.find(p => p.owner !== tank.id && sweepCircle(p, { x: p.vx * 0.6, y: p.vy * 0.6 }, tank, tank.radius + 12) !== null);
      if (danger && tank.kind !== 'basic' && this.random() < 0.4) {
        let dodge = { x: -danger.vy, y: danger.vx }; const l = Math.hypot(dodge.x, dodge.y); dodge = { x: dodge.x / l, y: dodge.y / l };
        if (!world.canStand({ x: tank.x + dodge.x * 35, y: tank.y + dodge.y * 35 }, tank.radius, tank.id)) dodge = { x: -dodge.x, y: -dodge.y };
        plan.move = dodge; tank.state = 'Evade';
      } else {
        while (tank.path.length && Math.hypot(tank.path[0].x - tank.x, tank.path[0].y - tank.y) < 10) tank.path.shift();
        const goal = tank.path[0];
        plan.move = goal ? { x: goal.x - tank.x, y: goal.y - tank.y } : { x: 0, y: 0 };
      }
    }
    const speed = { basic: 36, patrol: 75, tactical: 0, player: 155 }[tank.kind] * SPEED_SCALE * Math.min(1.2, 0.85 + world.level.difficulty * 0.12);
    // Track navigation waypoints continuously; reaction intervals only govern decisions.
    if (tank.state !== 'Evade') {
      while (tank.path.length && Math.hypot(tank.path[0].x - tank.x, tank.path[0].y - tank.y) < 9) tank.path.shift();
      const next = tank.path[0];
      plan.move = next ? { x: next.x - tank.x, y: next.y - tank.y } : { x: 0, y: 0 };
    }
    const old = { x: tank.x, y: tank.y };
    const moveSpeed = tank.state === 'Evade' ? speed : Math.min(speed, Math.hypot(plan.move.x, plan.move.y) / Math.max(dt, 0.001));
    world.move(tank, plan.move, moveSpeed, dt);
    if (Math.hypot(plan.move.x, plan.move.y) && Math.hypot(tank.x - old.x, tank.y - old.y) < 0.01) {
      plan.stuck += dt;
      if (plan.stuck > 0.7) {
        const n = this.random() * Math.PI * 2;
        tank.goal = { x: tank.x + Math.cos(n) * 110, y: tank.y + Math.sin(n) * 110 };
        tank.path = findPath(tank, tank.goal, movementSolids, 20, world.arena); tank.pathTime = 0.7; tank.think = 0; plan.stuck = 0;
      }
    } else plan.stuck = 0;
    if (plan.angle !== null) {
      tank.turret = lerpAngle(tank.turret, plan.angle, dt * (tank.kind === 'basic' ? 2 : 3.4));
      if (plan.reaction <= 0 && Math.abs(wrapAngle(tank.turret - plan.angle)) < 0.08 && tank.state !== 'Evade') {
        // Fairness: one active shell per slow enemy, with finite reaction and aim error.
        const count = world.projectiles.filter(p => p.owner === tank.id).length;
        if (count < enemyProfile(tank.kind).limit) {
          const saved = tank.turret; tank.turret += (this.random() - 0.5) * 0.06;
          if (world.fire(tank)) { tank.state = 'Shoot'; tank.cooldown /= enemyReloadScale(world.level.difficulty); plan.reaction = 0.35 + this.random() * 0.45; }
          tank.turret = saved;
        }
      }
    } else tank.turret = lerpAngle(tank.turret, tank.angle, dt * 2);
  }
}
