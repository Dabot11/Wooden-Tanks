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
import { buildDuoCampaign } from './missions/duo';
import { hunterPartyDebut } from './missions/hunterDebut';
import { authorParty } from './missions/partyCampaign';
import { authorEarlyParty } from './missions/earlyPartyCampaign';
export { boardHoles } from './missions/shared';

// Preserve the legacy catalog for historical comparisons; playable teams use authored formations.
export const cooperativeLevels = registerCampaign([chapter1, chapter2, chapter3, chapter4]);
const revisions = [soloChapter1, soloChapter2, soloChapter3, soloChapter4];
export const levels = registerCampaign(revisions.map(chapter => chapter.map(revision => ({ ...cooperativeLevels[revision.id - 1], ...revision }))));
export const duoLevels = buildDuoCampaign(levels);
const partyVariants=(count:3|4)=>cooperativeLevels.map(level=>level.id===21?hunterPartyDebut(levels[20],count):level.id>21?authorParty(levels[level.id-1],duoLevels[level.id-1],count):authorEarlyParty(levels[level.id-1],duoLevels[level.id-1],count));
export const campaignVariants: Record<PlayerCount, typeof levels> = { 1: levels, 2: duoLevels, 3: partyVariants(3), 4: partyVariants(4) };
/** Mission identity and progress are shared; authored geometry can vary by party size. */
export function getLevel(index: number, playerCount: PlayerCount = 1) {
  const selected = Math.max(0, Math.min(levels.length - 1, index));
  return campaignVariants[playerCount][selected] ?? levels[selected];
}
