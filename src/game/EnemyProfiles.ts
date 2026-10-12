import { SHOT_SPEED } from './types';
import type { TankKind } from './types';
export const enemyProfile = (kind: TankKind) => kind === 'basic'
  ? { speed: SHOT_SPEED, bounces: 0, limit: 1, cooldown: 1.5 }
  : kind === 'tactical' ? { speed: SHOT_SPEED * 1.8, bounces: 1, limit: 1, cooldown: 3.4 }
  : { speed: SHOT_SPEED, bounces: 1, limit: 2, cooldown: 1.25 };
