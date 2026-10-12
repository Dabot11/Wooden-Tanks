export interface Save { unlocked: number; best: number; muted: boolean; wins: number }
const defaults: Save = { unlocked: 1, best: 0, muted: false, wins: 0 };
export class Progress {
  data: Save = { ...defaults };
  constructor() {
    try {
      const raw = JSON.parse(localStorage.getItem('wooden-tanks-v1') ?? '{}');
      const integer = (v: unknown, fallback: number, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(fallback, Math.floor(v))) : fallback;
      this.data = { unlocked: integer(raw.unlocked, 1, 10), best: integer(raw.best, 0, 9999999), wins: integer(raw.wins, 0, 999999), muted: raw.muted === true };
    } catch { /* Private browsing and corrupt saves should never prevent play. */ }
  }
  save() { try { localStorage.setItem('wooden-tanks-v1', JSON.stringify(this.data)); } catch { /* Session remains playable without storage. */ } }
  record(score: number) { this.data.best = Math.max(this.data.best, score); this.save(); }
  unlock(level: number) { this.data.unlocked = Math.min(10, Math.max(this.data.unlocked, level)); this.save(); }
}
export const progress = new Progress();
