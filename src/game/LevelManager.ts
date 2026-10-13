import { registerCampaign } from './Campaign';
import { chapter1 } from './missions/chapter1';
import { chapter2 } from './missions/chapter2';
import { chapter3 } from './missions/chapter3';
import { chapter4 } from './missions/chapter4';
export { boardHoles } from './missions/shared';

// Add authored chapters here; the campaign, UI and saves derive their length.
export const levels = registerCampaign([chapter1, chapter2, chapter3, chapter4]);
export function getLevel(index: number) { return levels[Math.max(0, Math.min(levels.length - 1, index))]; }
