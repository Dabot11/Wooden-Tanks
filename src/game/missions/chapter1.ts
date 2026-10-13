import type { Level } from '../types';
import { block, enemy, mission } from './shared';
export const chapter1: Level[] = [
  mission(1, 'Primeras huellas', 'Mueve el tanque. Encuentra tu ángulo.', [block(610, 265, 44, 150)], [enemy(1030, 170, 'basic')], 0.65),
  mission(2, 'Dos esquinas', 'La paciencia también es una estrategia.', [block(390, 200, 176, 44), block(780, 370, 176, 44)], [enemy(1050, 170, 'basic'), enemy(980, 530, 'basic')], 0.8),
  mission(3, 'De patrulla', 'Los morados nunca se quedan quietos.', [block(450, 100, 44, 200), block(790, 370, 44, 180)], [enemy(1040, 150, 'patrol'), enemy(960, 500, 'basic')], 0.95),
  mission(4, 'Efecto rebote', 'Dos rebotes. Infinitas posibilidades.', [block(430, 220, 44, 260), block(790, 100, 44, 250), block(580, 350, 120, 44)], [enemy(650, 170, 'basic'), enemy(1060, 490, 'patrol'), enemy(1070, 160, 'basic')], 1),
  mission(5, 'Astillas', 'Tres impactos abren un nuevo camino.', [block(430, 180, 44, 210), block(430, 390, 44, 66, true), block(790, 190, 44, 66, true), block(790, 256, 44, 220)], [enemy(640, 190, 'patrol'), enemy(1040, 480, 'patrol'), enemy(1060, 160, 'basic')], 1.15),
  mission(6, 'Sin tregua', 'Los violetas presionan por ambos flancos.', [block(330, 220, 150, 44), block(650, 410, 150, 44), block(920, 170, 44, 160)], [enemy(1040, 500, 'patrol'), enemy(1030, 130, 'patrol'), enemy(600, 170, 'patrol')], 1.25),
  mission(7, 'A cubierto', 'Centinela inmóvil: salvas, esquivas y rebotes.', [block(350, 340, 44, 150), block(580, 160, 44, 160), block(840, 340, 44, 160), block(970, 150, 88, 44, true)], [enemy(1100, 220, 'tactical'), enemy(700, 520, 'patrol'), enemy(740, 120, 'basic')], 1.35),
  mission(8, 'El laberinto', 'Busca rutas. Evita las emboscadas.', [block(310, 120, 44, 250), block(520, 330, 44, 220), block(730, 120, 44, 230), block(940, 340, 44, 210), block(730, 350, 44, 44, true)], [enemy(470, 170, 'patrol'), enemy(860, 520, 'tactical'), enemy(1080, 160, 'patrol'), enemy(1080, 510, 'basic')], 1.45),
  mission(9, 'Fuego cruzado', 'No pierdas de vista ningún cañón.', [block(400, 210, 132, 44), block(748, 210, 132, 44), block(400, 430, 132, 44), block(748, 430, 132, 44), block(616, 300, 44, 66, true)], [enemy(1050, 140, 'tactical'), enemy(1050, 520, 'patrol'), enemy(620, 130, 'patrol'), enemy(650, 535, 'patrol')], 1.6),
  mission(10, 'Maestro del taller', 'Todo lo aprendido. El taller continúa.', [block(350, 170, 44, 175), block(550, 380, 44, 150), block(700, 140, 44, 175), block(890, 360, 44, 160), block(550, 314, 44, 66, true), block(890, 294, 44, 66, true)], [enemy(1080, 120, 'tactical'), enemy(1080, 520, 'tactical'), enemy(870, 190, 'patrol'), enemy(710, 510, 'patrol'), enemy(520, 180, 'basic')], 1.8),
];
