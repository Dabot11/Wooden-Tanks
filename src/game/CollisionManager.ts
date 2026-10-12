import type { Rect, Vec } from './types';
export interface Hit { t: number; normal: Vec }
/** Swept point vs box. Expanding the box accounts for a projectile radius. */
export function sweepBox(p: Vec, delta: Vec, box: Rect, radius = 0): Hit | null {
  const min = { x: box.x - radius, y: box.y - radius };
  const max = { x: box.x + box.w + radius, y: box.y + box.h + radius };
  let near = -Infinity, far = Infinity;
  let normal: Vec = { x: 0, y: 0 };
  for (const axis of ['x', 'y'] as const) {
    if (Math.abs(delta[axis]) < 1e-9) {
      if (p[axis] < min[axis] || p[axis] > max[axis]) return null;
      continue;
    }
    let a = (min[axis] - p[axis]) / delta[axis];
    let b = (max[axis] - p[axis]) / delta[axis];
    const sign = delta[axis] > 0 ? -1 : 1;
    if (a > b) [a, b] = [b, a];
    if (a > near + 1e-8) {
      near = a;
      normal = { x: axis === 'x' ? sign : 0, y: axis === 'y' ? sign : 0 };
    } else if (Math.abs(a - near) < 1e-8) {
      // A corner hit reflects both components using the diagonal normal.
      normal[axis] = sign;
      const length = Math.hypot(normal.x, normal.y);
      normal.x /= length; normal.y /= length;
    }
    far = Math.min(far, b);
    if (near > far) return null;
  }
  if (near < -1e-8 || near > 1 || far < 0) return null;
  return { t: Math.max(0, near), normal };
}
export function sweepCircle(p: Vec, delta: Vec, center: Vec, radius: number): number | null {
  const ox = p.x - center.x, oy = p.y - center.y;
  const a = delta.x ** 2 + delta.y ** 2;
  const c = ox ** 2 + oy ** 2 - radius ** 2;
  if (c <= 0) return 0;
  if (a < 1e-12) return null;
  const b = 2 * (ox * delta.x + oy * delta.y);
  const d = b * b - 4 * a * c;
  if (d < 0) return null;
  const t = (-b - Math.sqrt(d)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
export function reflect(v: Vec, n: Vec): Vec {
  const dot = v.x * n.x + v.y * n.y;
  return { x: v.x - 2 * dot * n.x, y: v.y - 2 * dot * n.y };
}
export function circleBox(p: Vec, radius: number, box: Rect): boolean {
  const x = Math.max(box.x, Math.min(box.x + box.w, p.x));
  const y = Math.max(box.y, Math.min(box.y + box.h, p.y));
  return (p.x - x) ** 2 + (p.y - y) ** 2 < radius ** 2 - 0.001;
}
export function lineClear(a: Vec, b: Vec, boxes: Rect[], radius = 3): boolean {
  return !boxes.some(box => sweepBox(a, { x: b.x - a.x, y: b.y - a.y }, box, radius));
}
