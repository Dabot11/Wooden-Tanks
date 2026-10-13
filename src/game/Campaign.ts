import type { Level } from './types';
export const CHAPTER_SIZE = 10;
/** Fail early on missing/repeated missions or a backwards difficulty curve. No length cap. */
export function registerCampaign(chapters: readonly (readonly Level[])[]): Level[] {
  const missions = chapters.flat();
  for (let i = 0; i < missions.length; i++) {
    const level = missions[i];
    if (level.id !== i + 1 || !Number.isFinite(level.difficulty) || level.difficulty <= 0 ||
        (i > 0 && level.difficulty < missions[i - 1].difficulty) || !level.enemies.length)
      throw new Error(`Invalid campaign mission ${level.id}: check order, difficulty and roster`);
  }
  if (!missions.length) throw new Error('A campaign needs at least one mission');
  return missions;
}
/** Preserve the introductory curve; late chapters add pressure gradually. */
export function lateCampaignDifficulty(id: number) { return 2.8 + Math.max(0, id - 30) * 0.05; }
/** Avoid unbounded firing speeds as the campaign grows past 100 missions. */
export function enemyReloadScale(difficulty: number) {
  if (difficulty <= 2.8) return Math.min(1.35, Math.max(0.65, difficulty));
  return 1.35 + 0.3 * (1 - Math.exp(-(difficulty - 2.8) / 2));
}
