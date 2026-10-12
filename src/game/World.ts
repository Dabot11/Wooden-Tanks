import { ARENA, SHOT_LIMIT, SHOT_SPEED, TANK_SPEED, lerpAngle } from './types';
import type { Tank, Projectile, Obstacle, Level, Vec, CombatEvent, Rect, Hole, PlayerInput } from './types';
import { circleBox, circleCircle, sweepBox, sweepCircle, reflect, lineClear } from './CollisionManager';
import { createTank } from './Tank';
import { EnemyAI } from './EnemyAI';
function isObstacle(value: Rect): value is Obstacle { return 'destructible' in value; }
export class World {
  holes: Hole[]; tanks: Tank[]; projectiles: Projectile[] = []; obstacles: Obstacle[];
  events: CombatEvent[] = []; elapsed = 0; ai = new EnemyAI(); private nextId = 100;
  walls: Rect[] = [
    { x: ARENA.x - 40, y: ARENA.y - 40, w: 40, h: ARENA.h + 80 },
    { x: ARENA.x + ARENA.w, y: ARENA.y - 40, w: 40, h: ARENA.h + 80 },
    { x: ARENA.x - 40, y: ARENA.y - 40, w: ARENA.w + 80, h: 40 },
    { x: ARENA.x - 40, y: ARENA.y + ARENA.h, w: ARENA.w + 80, h: 40 },
  ];
  constructor(public level: Level, playerCount: 1 | 2 = 1) {
    this.holes = (level.holes ?? []).map(hole => ({ ...hole }));
    this.tanks = [createTank(0, 'player', level.player), ...level.enemies.map((s, i) => createTank(i + 1, s.kind, s))];
    this.obstacles = level.obstacles.map((o, i) => ({ ...o, id: i, hp: 3, alive: true, destructible: !!o.destructible }));
    if (playerCount === 2) this.tanks.push(createTank(-1, 'player', this.partnerSpawn()));
  }
  get player() { return this.tanks[0]; }
  get players() { return this.tanks.filter(t => t.kind === 'player'); }
  get alivePlayers() { return this.players.filter(t => t.alive); }
  private partnerSpawn(): Vec {
    // Pick a nearby free spot with a clear route to P1, never across a wall or pit.
    for (let distance = 52; distance < ARENA.w; distance += 16) for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      const p = { x: this.player.x + Math.cos(angle) * distance, y: this.player.y + Math.sin(angle) * distance };
      if (p.x < ARENA.x + 19 || p.x > ARENA.x + ARENA.w - 19 || p.y < ARENA.y + 19 || p.y > ARENA.y + ARENA.h - 19) continue;
      if (this.canStand(p, 19) && lineClear(this.player, p, this.movementSolids, 19)) return p;
    }
    throw new Error('No safe cooperative spawn on this board');
  }
  get enemies() { return this.tanks.filter(t => t.kind !== 'player' && t.alive); }
  get solids(): Rect[] { return [...this.walls, ...this.obstacles.filter(o => o.alive)]; }
  // Navigation conservatively bounds circular pits; bullets and line of sight use solids only.
  get movementSolids(): Rect[] {
    return [...this.solids, ...this.holes.map(h => ({ x: h.x - h.radius, y: h.y - h.radius, w: h.radius * 2, h: h.radius * 2 }))];
  }
  canStand(p: Vec, radius: number, except = -1): boolean {
    return !this.solids.some(box => circleBox(p, radius, box)) &&
      !this.holes.some(hole => circleCircle(p, radius, hole, hole.radius)) &&
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
    if (!tank.alive || tank.cooldown > 0 || this.projectiles.filter(p => p.alive && p.owner === tank.id).length >= (tank.kind === 'player' ? SHOT_LIMIT : 2)) return false;
    const direction = { x: Math.cos(tank.turret), y: Math.sin(tank.turret) };
    const muzzle = { x: tank.x + direction.x * 32, y: tank.y + direction.y * 32 };
    if (!lineClear(tank, muzzle, this.solids, 4)) return false;
    this.projectiles.push({ ...muzzle, id: this.nextId++, owner: tank.id, vx: direction.x * SHOT_SPEED,
      vy: direction.y * SHOT_SPEED, age: 0, bounces: 0, alive: true });
    tank.cooldown = tank.kind === 'player' ? 0.28 : tank.kind === 'offensive' ? 1.4 : 2.3;
    tank.shots++;
    this.events.push({ type: 'shot', ...muzzle, angle: tank.turret, player: tank.kind === 'player' });
    return true;
  }
  update(dt: number, input: PlayerInput, ai = true, secondInput?: PlayerInput) {
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    this.tanks.forEach(t => { t.cooldown = Math.max(0, t.cooldown - dt); });
    for (const [index, tank] of this.players.entries()) {
      const controls = index === 0 ? input : secondInput;
      if (!tank.alive || !controls) continue;
      this.move(tank, controls.move, TANK_SPEED, dt);
      tank.turret = lerpAngle(tank.turret, Math.atan2(controls.aim.y - tank.y, controls.aim.x - tank.x), dt * 24);
      if (controls.fire) this.fire(tank);
    }
    if (ai && this.alivePlayers.length) for (const tank of this.enemies) this.ai.update(this, tank, dt);
    this.stepProjectiles(this.projectiles, dt);
    this.projectiles = this.projectiles.filter(p => p.alive);
  }
  stepProjectile(p: Projectile, dt: number) {
    this.stepProjectiles([p], dt);
  }
  private stepProjectiles(projectiles: Projectile[], dt: number) {
    for (const p of projectiles) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age > 7) p.alive = false;
    }
    let time = dt;
    // Advance every shell to the earliest shared impact, then recalculate trajectories.
    // Relative sweeps catch crossing shells and respect earlier walls, hits and ricochets.
    while (time > 1e-7) {
      const active = projectiles.filter(p => p.alive);
      if (!active.length) break;
      let first = 1.001;
      let source: Projectile | null = null;
      let target: Tank | Obstacle | Rect | Projectile | null = null;
      let normal: Vec = { x: 0, y: 0 };
      const playerIds = new Set(this.players.map(t => t.id));
      for (let i = 0; i < active.length; i++) {
        const p = active[i], delta = { x: p.vx * time, y: p.vy * time };
        for (const box of this.solids) {
          const hit = sweepBox(p, delta, box, 4);
          if (hit && hit.t < first) { first = hit.t; normal = hit.normal; source = p; target = box; }
        }
        for (const tank of this.tanks) {
          if (tank.kind === 'player' && tank.id !== p.owner && playerIds.has(p.owner)) continue;
          if (!tank.alive || (tank.id === p.owner && p.age < 0.12 && !p.bounces)) continue;
          const hit = sweepCircle(p, delta, tank, tank.radius + 3);
          if (hit !== null && hit < first) { first = hit; source = p; target = tank; }
        }
        for (let j = i + 1; j < active.length; j++) {
          const other = active[j];
          const hit = sweepCircle(p, { x: (p.vx - other.vx) * time, y: (p.vy - other.vy) * time }, other, 8);
          if (hit !== null && hit < first) { first = hit; source = p; target = other; }
        }
      }
      const advance = source ? time * first : time;
      for (const p of active) { p.x += p.vx * advance; p.y += p.vy * advance; }
      if (!source || !target) break;
      time -= advance;
      if ('owner' in target) {
        source.alive = false; target.alive = false;
        this.events.push({ type: 'impact', x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 });
      } else if ('kind' in target) {
        target.alive = false; source.alive = false;
        this.events.push({ type: 'destroy', x: target.x, y: target.y, player: target.kind === 'player', kind: target.kind });
      } else if (isObstacle(target) && target.destructible) {
        target.hp--; source.alive = false;
        this.events.push({ type: 'impact', x: source.x, y: source.y });
        if (target.hp <= 0) {
          target.alive = false;
          this.events.push({ type: 'break', x: target.x + target.w / 2, y: target.y + target.h / 2 });
        }
      } else {
        const velocity = reflect({ x: source.vx, y: source.vy }, normal);
        source.vx = velocity.x; source.vy = velocity.y; source.bounces++;
        source.x += normal.x * 0.15; source.y += normal.y * 0.15;
        this.events.push({ type: 'bounce', x: source.x, y: source.y });
        if (source.bounces > 2) source.alive = false;
      }
    }
  }
}
