import type { PlayerCount } from './types';
import { registerCampaign } from './Campaign';
import { chapter1 } from './missions/chapter1';
import { chapter2 } from './missions/chapter2';
import { chapter3 } from './missions/chapter3';
import { chapter4 } from './missions/chapter4';
import { soloChapter1 } from './missions/solo/chapter1';
import { soloChapter2 } from './missions/solo/chapter2';
import { soloChapter3 } from './missions/solo/chapter3';
import { soloChapter4 } from './missions/solo/chapter4';
export { boardHoles } from './missions/shared';

// Keep the existing 2–4 player layouts until their dedicated design reviews.
export const cooperativeLevels = registerCampaign([chapter1, chapter2, chapter3, chapter4]);
const revisions = [soloChapter1, soloChapter2, soloChapter3, soloChapter4];
export const levels = registerCampaign(revisions.map(chapter => chapter.map(revision => ({ ...cooperativeLevels[revision.id - 1], ...revision }))));
export const campaignVariants: Record<PlayerCount, typeof levels> = { 1: levels, 2: cooperativeLevels, 3: cooperativeLevels, 4: cooperativeLevels };
/** Mission identity and progress are shared; authored geometry can vary by party size. */
export function getLevel(index: number, playerCount: PlayerCount = 1) {
  const selected = Math.max(0, Math.min(levels.length - 1, index));
  return campaignVariants[playerCount][selected] ?? levels[selected];
}
