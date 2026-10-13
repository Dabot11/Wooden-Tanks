import { levels } from './LevelManager';
export interface Save { unlocked: number; best: number; muted: boolean; wins: number }
const defaults: Save = { unlocked: 1, best: 0, muted: false, wins: 0 };
export class Progress {
  data: Save = { ...defaults };
  constructor() {
    try {
      const raw = JSON.parse(localStorage.getItem('wooden-tanks-v1') ?? '{}');
      const integer = (v: unknown, fallback: number, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(fallback, Math.floor(v))) : fallback;
      this.data = { unlocked: integer(raw.unlocked, 1, levels.length), best: integer(raw.best, 0, 9999999), wins: integer(raw.wins, 0, 999999), muted: raw.muted === true };
      // Completed saves from earlier campaign lengths start their next chapter.
      if (this.data.wins > 0 && [10, 20].includes(this.data.unlocked) && levels.length > this.data.unlocked) { this.data.unlocked++; this.save(); }
    } catch { /* Private browsing and corrupt saves should never prevent play. */ }
  }
  save() { try { localStorage.setItem('wooden-tanks-v1', JSON.stringify(this.data)); } catch { /* Session remains playable without storage. */ } }
  record(score: number) { this.data.best = Math.max(this.data.best, score); this.save(); }
  unlock(level: number) { this.data.unlocked = Math.min(levels.length, Math.max(this.data.unlocked, level)); this.save(); }
}
export const progress = new Progress();
