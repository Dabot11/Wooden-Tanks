import type { PlayerCount, Level } from './types';
import { registerCampaign } from './Campaign';
import { chapter1 } from './missions/chapter1';
import { chapter2 } from './missions/chapter2';
import { chapter3 } from './missions/chapter3';
import { chapter4 } from './missions/chapter4';
import { soloChapter1 } from './missions/solo/chapter1';
import { soloChapter2 } from './missions/solo/chapter2';
import { soloChapter3 } from './missions/solo/chapter3';
import { soloChapter4 } from './missions/solo/chapter4';
import { buildDuoCampaign } from './missions/duo';
import { hunterPartyDebut } from './missions/hunterDebut';
import { authorParty } from './missions/partyCampaign';
import { authorEarlyParty } from './missions/earlyPartyCampaign';
import { buildChapterCampaign } from './missions/chapterProgression';
export { ENEMY_CHAPTERS } from './missions/chapterProgression';
export const HUNTER_DEBUT_INDEX = 30;
export const GALLERY_INDEX = 25;
export { boardHoles } from './missions/shared';

// Preserve the legacy catalog for historical comparisons; playable teams use authored formations.
export const cooperativeLevels = registerCampaign([chapter1, chapter2, chapter3, chapter4]);
const revisions = [soloChapter1, soloChapter2, soloChapter3, soloChapter4];
const templateSolo = registerCampaign(revisions.map(chapter => chapter.map(revision => ({ ...cooperativeLevels[revision.id - 1], ...revision }))));
const templateDuo = buildDuoCampaign(templateSolo);
const partyVariants=(count:3|4)=>cooperativeLevels.map(level=>level.id===21?hunterPartyDebut(templateSolo[20],count):level.id>21?authorParty(templateSolo[level.id-1],templateDuo[level.id-1],count):authorEarlyParty(templateSolo[level.id-1],templateDuo[level.id-1],count));
/** Reviewed geometry before the chapter restructure, retained for atlas comparisons. */
export const templateCampaignVariants: Record<PlayerCount, Level[]> = { 1: templateSolo, 2: templateDuo, 3: partyVariants(3), 4: partyVariants(4) };
export const campaignVariants = Object.fromEntries(([1,2,3,4] as const).map(count=>[count,registerCampaign([buildChapterCampaign(templateCampaignVariants,count)])])) as Record<PlayerCount,Level[]>;
export const levels = campaignVariants[1];
export const duoLevels = campaignVariants[2];
/** Mission identity and progress are shared; authored geometry can vary by party size. */
export function getLevel(index: number, playerCount: PlayerCount = 1) {
  const selected = Math.max(0, Math.min(levels.length - 1, index));
  return campaignVariants[playerCount][selected] ?? levels[selected];
}
