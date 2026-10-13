import { ARENA, PLAYER_SHOT_INTERVAL, SHOT_SPEED, TANK_SPEED, lerpAngle } from './types';
import type { Tank, Projectile, Obstacle, Level, Vec, CombatEvent, Rect, Hole, PlayerInput } from './types';
import { circleBox, circleCircle, sweepBox, sweepCircle, reflect, lineClear } from './CollisionManager';
import { enemyProfile } from './EnemyProfiles';
import type { PlayerCount } from './types';
import { duelSpawns } from './Duel';
import { createTank } from './Tank';
import { EnemyAI, findPath } from './EnemyAI';
function isObstacle(value: Rect): value is Obstacle { return 'destructible' in value; }
export class World {
  holes: Hole[]; tanks: Tank[]; projectiles: Projectile[] = []; obstacles: Obstacle[];
  events: CombatEvent[] = []; elapsed = 0; ai = new EnemyAI(); private nextId = 100;
  arena: Rect;
  walls: Rect[];
  constructor(public level: Level, playerCount: PlayerCount = 1, mode: 'campaign' | 'duel' = 'campaign') {
    const scale = 1 + (playerCount - 1) * 0.2;
    // Reserve extra friendly staging terrain in co-op instead of filling every corner with enemies.
    const staging = mode === 'campaign' && !level.bankShotOnly ? 120 * (playerCount - 1) * scale : 0;
    const heightScale = scale + staging / ARENA.w;
    const point = (p: Vec) => ({ x: ARENA.x + staging + (p.x - ARENA.x) * scale, y: ARENA.y + (p.y - ARENA.y) * heightScale });
    if (playerCount > 1) this.level = level = { ...level, arena: { ...ARENA, w: ARENA.w * scale + staging, h: ARENA.h * heightScale }, player: point(level.player), enemies: level.enemies.map(e => ({ ...e, ...point(e) })), obstacles: level.obstacles.map(o => ({ ...o, ...point(o), w: o.w * scale, h: o.h * heightScale })), holes: level.holes?.map(h => ({ ...h, ...point(h) })) };
    this.arena = level.arena ?? ARENA;
    const bounds = this.arena;
    this.walls = [
    { x: bounds.x - 40, y: bounds.y - 40, w: 40, h: bounds.h + 80 },
    { x: bounds.x + bounds.w, y: bounds.y - 40, w: 40, h: bounds.h + 80 },
    { x: bounds.x - 40, y: bounds.y - 40, w: bounds.w + 80, h: 40 },
    { x: bounds.x - 40, y: bounds.y + bounds.h, w: bounds.w + 80, h: 40 },
    ];

    this.holes = (level.holes ?? []).map(hole => ({ ...hole }));
    this.tanks = [createTank(0, 'player', level.player), ...level.enemies.map((s, i) => createTank(i + 1, s.kind, s))];
    this.obstacles = level.obstacles.map((o, i) => ({ ...o, id: i, hp: 3, alive: true, destructible: !!o.destructible }));
    const spawns = mode === 'duel' ? duelSpawns(playerCount).map(point) : playerCount > 1 ? this.cooperativeSpawns(playerCount) : undefined;
    if (spawns) Object.assign(this.player, spawns[0]);
    for (let slot = 1; slot < playerCount; slot++) this.tanks.push(createTank(-slot, 'player', spawns![slot]));
    if (mode === 'campaign' && playerCount > 1) for (const player of this.players) player.turret = player.angle = 0;
    // Add one complete wave per additional player; distribute it over free terrain.
    const extra = level.enemies.length * (playerCount - 1);
    for (let i = 0; i < extra; i++) {
      const source = level.enemies[i % level.enemies.length];
      let spawn: Vec | undefined;
      for (let y = this.arena.y + 100 * scale; y < this.arena.y + this.arena.h - 40 && !spawn; y += 72)
        for (let x = this.arena.x + this.arena.w - 60; x > this.arena.x + this.arena.w * 0.45; x -= 72)
          if (this.canStand({ x, y }, 25) && this.players.every(p => Math.hypot(p.x - x, p.y - y) > 280 * scale)) { spawn = { x, y }; break; }
      if (!spawn) throw new Error('No safe reinforcement spawn');
      this.tanks.push(createTank(level.enemies.length + i + 1, source.kind, spawn));
    }
  }
  get player() { return this.tanks[0]; }
  get players() { return this.tanks.filter(t => t.kind === 'player'); }
  get alivePlayers() { return this.players.filter(t => t.alive); }
  private cooperativeSpawns(count: PlayerCount): Vec[] {
    const scale = 1 + (count - 1) * 0.2, a = this.arena;
    const candidates: Vec[] = [];
    // Reachable staging terrain on the friendly side; never inside a pit or enemy nest.
    for (let y = a.y + 90 * scale; y < a.y + a.h - 50 * scale; y += 40 * scale)
      for (let x = a.x + 50 * scale; x < a.x + a.w * 0.4; x += 40 * scale) {
        const p = { x, y };
        if (this.enemies.some(t => Math.hypot(t.x - x, t.y - y) < 190 * scale) || !this.canStand(p, 28) || !lineClear(p, { x: x + 120, y }, this.solids, 5) ||
            !findPath(this.player, p, this.movementSolids, 20, a).length) continue;
        candidates.push(p);
      }
    const chosen: Vec[] = [{ x: this.player.x, y: this.player.y }];
    const separation = (p: Vec) => Math.min(...chosen.map(t => Math.hypot(t.x - p.x, t.y - p.y)));
    const place = (): boolean => {
      if (chosen.length === count) return true;
      const available = candidates.filter(p => separation(p) >= 180 * scale && chosen.every(t => Math.abs(t.y - p.y) >= 60 * scale));
      available.sort((p, q) => (separation(q) - Math.abs(q.x - (a.x + a.w * 0.17)) * 0.15) - (separation(p) - Math.abs(p.x - (a.x + a.w * 0.17)) * 0.15));
      for (const candidate of available) {
        chosen.push(candidate);
        if (place()) return true;
        chosen.pop();
      }
      return false;
    };
    // Solve the whole team together; greedy placement can strand P4 in restricted maps.
    if (!place()) throw new Error(`No separated cooperative layout on mission ${this.level.id}`);
    return chosen;
  }
  get enemies() { return this.tanks.filter(t => t.kind !== 'player' && t.alive); }
  get solids(): Rect[] { return [...this.walls, ...this.obstacles.filter(o => o.alive)]; }
  // Navigation conservatively bounds circular pits; bullets and line of sight use solids only.
  get movementSolids(): Rect[] {
    return [...this.solids, ...this.holes.map(h => ({ x: h.x - h.radius, y: h.y - h.radius, w: h.radius * 2, h: h.radius * 2 }))];
  }
  canStand(p: Vec, radius: number, except = Number.NaN): boolean {
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
    const profile = enemyProfile(tank.kind);
    if (!tank.alive || tank.cooldown > 0 || (tank.kind !== 'player' && this.projectiles.filter(p => p.alive && p.owner === tank.id).length >= profile.limit)) return false;
    const direction = { x: Math.cos(tank.turret), y: Math.sin(tank.turret) };
    const muzzle = { x: tank.x + direction.x * 32, y: tank.y + direction.y * 32 };
    if (!lineClear(tank, muzzle, this.solids, 4)) return false;
    const speed = tank.kind === 'player' ? SHOT_SPEED : profile.speed;
    this.projectiles.push({ ...muzzle, id: this.nextId++, owner: tank.id, vx: direction.x * speed,
      vy: direction.y * speed, age: 0, bounces: 0, alive: true, maxBounces: tank.kind === 'player' ? 2 : profile.bounces, propelled: tank.kind === 'tactical' });
    tank.cooldown = tank.kind === 'player' ? PLAYER_SHOT_INTERVAL : profile.cooldown;
    tank.shots++;
    this.events.push({ type: 'shot', ...muzzle, angle: tank.turret, player: tank.kind === 'player' });
    return true;
  }
  update(dt: number, input: PlayerInput, ai = true, secondInput?: PlayerInput | PlayerInput[]) {
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    this.tanks.forEach(t => { t.cooldown = Math.max(0, t.cooldown - dt); });
    for (const [index, tank] of this.players.entries()) {
      const controls = index === 0 ? input : Array.isArray(secondInput) ? secondInput[index - 1] : secondInput;
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
      for (let i = 0; i < active.length; i++) {
        const p = active[i], delta = { x: p.vx * time, y: p.vy * time };
        for (const box of this.solids) {
          const hit = sweepBox(p, delta, box, 4);
          if (hit && hit.t < first) { first = hit.t; normal = hit.normal; source = p; target = box; }
        }
        for (const tank of this.tanks) {
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
        this.events.push({ type: 'shellCollision', x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 });
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
        if (source.bounces > (source.maxBounces ?? 2)) source.alive = false;
      }
    }
  }
}
