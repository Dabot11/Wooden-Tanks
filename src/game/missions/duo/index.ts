import type { Level } from '../../types';
import { authorDuo } from './design';
import { duoChapter1 } from './chapter1';
import { duoChapter2 } from './chapter2';
import { duoChapter3 } from './chapter3';
import { duoChapter4 } from './chapter4';
export function buildDuoCampaign(solo: Level[]): Level[] {
  return [duoChapter1,duoChapter2,duoChapter3,duoChapter4].flat().map(plan=>authorDuo(solo[plan.id-1],plan));
}
