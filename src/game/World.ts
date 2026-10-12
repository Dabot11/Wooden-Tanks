import { ARENA, SHOT_LIMIT, SHOT_SPEED, TANK_SPEED, lerpAngle } from './types';
import type { Tank, Projectile, Obstacle, Level, Vec, CombatEvent, Rect } from './types';
import { circleBox, sweepBox, sweepCircle, reflect, lineClear } from './CollisionManager';
import { createTank } from './Tank';
import { EnemyAI } from './EnemyAI';
function isObstacle(value: Rect): value is Obstacle { return 'destructible' in value; }
export class World {
  tanks: Tank[]; projectiles: Projectile[] = []; obstacles: Obstacle[];
  events: CombatEvent[] = []; elapsed = 0; ai = new EnemyAI(); private nextId = 100;
  walls: Rect[] = [
    { x: ARENA.x - 40, y: ARENA.y - 40, w: 40, h: ARENA.h + 80 },
    { x: ARENA.x + ARENA.w, y: ARENA.y - 40, w: 40, h: ARENA.h + 80 },
    { x: ARENA.x - 40, y: ARENA.y - 40, w: ARENA.w + 80, h: 40 },
    { x: ARENA.x - 40, y: ARENA.y + ARENA.h, w: ARENA.w + 80, h: 40 },
  ];
  constructor(public level: Level) {
    this.tanks = [createTank(0, 'player', level.player), ...level.enemies.map((s, i) => createTank(i + 1, s.kind, s))];
    this.obstacles = level.obstacles.map((o, i) => ({ ...o, id: i, hp: 3, alive: true, destructible: !!o.destructible }));
  }
  get player() { return this.tanks[0]; }
  get enemies() { return this.tanks.filter(t => t.kind !== 'player' && t.alive); }
  get solids(): Rect[] { return [...this.walls, ...this.obstacles.filter(o => o.alive)]; }
  canStand(p: Vec, radius: number, except = -1): boolean {
    return !this.solids.some(box => circleBox(p, radius, box)) &&
      !this.tanks.some(t => t.alive && t.id !== except && Math.hypot(t.x - p.x, t.y - p.y) < t.radius + radius);
  }
  move(tank: Tank, direction: Vec, speed: number, dt: number) {
    const len = Math.hypot(direction.x, direction.y);
    if (!len || !tank.alive) return;
    const dx = direction.x / len * speed * dt, dy = direction.y / len * speed * dt;
    const old = { x: tank.x, y: tank.y };
    if (this.canStand({ x: tank.x + dx, y: tank.y }, tank.radius, tank.id)) tank.x += dx;
    if (this.canStand({ x: tank.x, y: tank.y + dy }, tank.radius, tank.id)) tank.y += dy;
    tank.angle = lerpAngle(tank.angle, Math.atan2(dy, dx), dt * 12);
    tank.distance += Math.hypot(tank.x - old.x, tank.y - old.y);
  }
  fire(tank: Tank): boolean {
    if (!tank.alive || tank.cooldown > 0 || this.projectiles.filter(p => p.alive && p.owner === tank.id).length >= (tank.id === 0 ? SHOT_LIMIT : 2)) return false;
    const direction = { x: Math.cos(tank.turret), y: Math.sin(tank.turret) };
    const muzzle = { x: tank.x + direction.x * 32, y: tank.y + direction.y * 32 };
    if (!lineClear(tank, muzzle, this.solids, 4)) return false;
    this.projectiles.push({ ...muzzle, id: this.nextId++, owner: tank.id, vx: direction.x * SHOT_SPEED,
      vy: direction.y * SHOT_SPEED, age: 0, bounces: 0, alive: true });
    tank.cooldown = tank.id === 0 ? 0.28 : tank.kind === 'offensive' ? 1.4 : 2.3;
    tank.shots++;
    this.events.push({ type: 'shot', ...muzzle, angle: tank.turret, player: tank.id === 0 });
    return true;
  }
  update(dt: number, input: { move: Vec; aim: Vec; fire: boolean }, ai = true) {
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    this.tanks.forEach(t => { t.cooldown = Math.max(0, t.cooldown - dt); });
    this.move(this.player, input.move, TANK_SPEED, dt);
    this.player.turret = lerpAngle(this.player.turret, Math.atan2(input.aim.y - this.player.y, input.aim.x - this.player.x), dt * 24);
    if (input.fire) this.fire(this.player);
    if (ai && this.player.alive) for (const tank of this.enemies) this.ai.update(this, tank, dt);
    for (const p of this.projectiles) if (p.alive) this.stepProjectile(p, dt);
    this.projectiles = this.projectiles.filter(p => p.alive);
  }
  stepProjectile(p: Projectile, dt: number) {
    p.age += dt;
    if (p.age > 7) { p.alive = false; return; }
    let time = dt;
    // Swept collision prevents tunneling; remaining time is consumed after reflection.
    for (let iteration = 0; iteration < 6 && time > 1e-7 && p.alive; iteration++) {
      const delta = { x: p.vx * time, y: p.vy * time };
      let first = 1.001;
      let target: Tank | Obstacle | Rect | null = null;
      let normal: Vec = { x: 0, y: 0 };
      for (const box of [...this.walls, ...this.obstacles.filter(o => o.alive)]) {
        const hit = sweepBox(p, delta, box, 4);
        if (hit && hit.t < first) { first = hit.t; normal = hit.normal; target = box; }
      }
      for (const tank of this.tanks) {
        if (!tank.alive || (tank.id === p.owner && p.age < 0.12 && !p.bounces)) continue;
        const hit = sweepCircle(p, delta, tank, tank.radius + 3);
        if (hit !== null && hit < first) { first = hit; target = tank; }
      }
      if (!target) { p.x += delta.x; p.y += delta.y; break; }
      p.x += delta.x * first; p.y += delta.y * first;
      time *= 1 - first;
      if ('kind' in target) {
        target.alive = false; p.alive = false;
        this.events.push({ type: 'destroy', x: target.x, y: target.y, player: target.id === 0, kind: target.kind });
      } else if (isObstacle(target) && target.destructible) {
        target.hp--; p.alive = false;
        this.events.push({ type: 'impact', x: p.x, y: p.y });
        if (target.hp <= 0) {
          target.alive = false;
          this.events.push({ type: 'break', x: target.x + target.w / 2, y: target.y + target.h / 2 });
        }
      } else {
        const velocity = reflect({ x: p.vx, y: p.vy }, normal);
        p.vx = velocity.x; p.vy = velocity.y; p.bounces++;
        p.x += normal.x * 0.15; p.y += normal.y * 0.15;
        this.events.push({ type: 'bounce', x: p.x, y: p.y });
        if (p.bounces > 2) p.alive = false;
      }
    }
  }
}
