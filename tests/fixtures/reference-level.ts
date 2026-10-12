import type { Level } from '../../src/game/types';
import { boardHoles } from '../../src/game/LevelManager';
const block = (x: number, y: number, w = 44, h = 88, destructible = false) => ({ x, y, w, h, destructible });
export const demo: Level = {
  id: 65, holes: boardHoles, name: 'El taller', subtitle: 'El tablero de referencia', difficulty: 1.4,
  player: { x: 388, y: 520 },
  enemies: [{ x: 610, y: 302, kind: 'basic' }, { x: 830, y: 220, kind: 'patrol' }, { x: 1040, y: 170, kind: 'patrol' }],
  obstacles: [
    block(684, 98, 44, 208), block(540, 354, 44, 194),
    block(258, 354, 44, 68), block(302, 374, 44, 48, true), block(346, 354, 44, 68),
    block(452, 354, 44, 68), block(496, 374, 44, 48, true),
    block(780, 286, 44, 68), block(874, 286, 44, 68),
    block(918, 306, 44, 48, true), block(962, 286, 44, 68),
  ],
};
