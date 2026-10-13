import type { Level, Spawn } from '../types';
import { lateCampaignDifficulty } from '../Campaign';
import { block, enemy, mission } from './shared';
// Positions are authored with cover and flanking lanes; no random mission generation.
const roster = (sentinels: number, raiders: number): Spawn[] => [
  ...[{ x: 1100, y: 120 }, { x: 1100, y: 530 }, { x: 820, y: 530 }, { x: 650, y: 130 }, { x: 1030, y: 330 }].slice(0, sentinels).map(p => enemy(p.x, p.y, 'tactical')),
  ...[{ x: 1000, y: 220 }, { x: 450, y: 440 }, { x: 650, y: 530 }, { x: 450, y: 130 }, { x: 1020, y: 480 }, { x: 650, y: 260 }, { x: 340, y: 320 }].slice(0, raiders).map(p => enemy(p.x, p.y, 'patrol')),
];
const battle = (id: number, name: string, subtitle: string, walls: Level['obstacles'], sentinels: number, raiders: number) =>
  mission(id, name, subtitle, walls, roster(sentinels, raiders), lateCampaignDifficulty(id), []);
export const chapter4: Level[] = [
  battle(31, 'El bastión', 'Cuatro centinelas. Divide su atención y busca el flanco.', [block(360,180,44,160),block(560,340,88,44),block(750,200,44,180),block(930,280,44,88,true)],4,5),
  battle(32, 'Callejón de astillas', 'Abre el corcho sin quedar expuesto a la siguiente salva.', [block(360,100,44,150),block(360,250,44,66,true),block(520,330,44,170),block(780,120,44,220),block(900,380,88,44)],4,5),
  battle(33, 'Tres cruces', 'Cada cruce exige una nueva cobertura.', [block(370,200,132,44),block(570,350,132,44),block(830,250,132,44),block(830,380,88,44,true)],4,6),
  battle(34, 'La tenaza', 'Los patrulleros rodean la cobertura. Conserva una salida.', [block(520,180,44,220),block(740,290,44,190),block(850,170,88,44),block(850,450,44,44,true)],4,6),
  battle(35, 'Ciudadela de corcho', 'Las compuertas protegen y también ocultan a los centinelas.', [block(370,180,132,44),block(500,224,44,110),block(700,350,44,140),block(744,350,88,44,true),block(880,170,44,180),block(880,350,44,66,true)],4,7),
  battle(36, 'Cinco vigías', 'Provoca su disparo y aprovecha la recarga compartiendo los ángulos.', [block(370,170,44,170),block(540,350,44,150),block(760,180,44,160),block(880,400,44,88,true)],5,6),
  battle(37, 'Dientes de madera', 'Los muros alternados convierten cada rebote en una oportunidad.', [block(340,100,44,170),block(520,360,44,170),block(750,100,44,220),block(900,390,44,140),block(600,340,66,44,true)],5,6),
  battle(38, 'El nudo', 'Cruza por los extremos; el centro recibe fuego de ambos lados.', [block(520,190,88,44),block(700,370,88,44),block(520,234,44,110),block(744,260,44,110),block(860,170,44,110,true)],5,7),
  battle(39, 'Asedio al taller', 'Abre un corredor y encadena salvas contra las defensas.', [block(370,170,44,200),block(540,390,44,120),block(740,120,44,200),block(890,360,44,170),block(540,324,44,66,true),block(890,294,44,66,true)],5,7),
  battle(40, 'Comandante del taller', 'Cuarenta batallas. Gana terreno antes de buscar el último rebote.', [block(370,170,44,160),block(540,350,44,180),block(740,120,44,180),block(890,380,44,150),block(540,284,44,66,true),block(890,314,44,66,true),block(820,210,88,44)],5,7),
];
