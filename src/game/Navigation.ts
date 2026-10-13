import { ARENA } from './types';
import type { Vec, Rect } from './types';
import { circleBox, lineClear } from './CollisionManager';
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
