import { block as w, enemy as e } from '../shared';
import { at, hole, post, revise, route } from './design';
export const soloChapter4 = [
  revise(31, at(170,320), [w(360,200,44,190),w(560,340,88,44),w(750,180,44,220),w(930,280,44,88,true)], [e(1060,130,'tactical'),e(1110,500,'tactical'),e(820,520,'tactical'),e(570,130,'patrol'),e(670,250,'patrol'),e(550,500,'patrol'),e(1040,230,'patrol')], {
    lesson:'Un bastión se conquista cambiando de flanco; no combatas sus tres defensas a la vez.', identity:'Dos muros verticales y una bisagra baja protegen tres puestos escalonados.', changes:'Inicio central protegido y siete enemigos situados según las coberturas, en lugar de reutilizar el grupo de nueve del capítulo anterior.',
    routes:[route('Flanco del bastión norte',[220,100],[600,100],[930,170]),route('Flanco del bastión sur',[250,550],[710,550],[1050,580])], bankTargets:[{from:post(710,550),enemy:0}],
  }),
  revise(32, at(170,500), [w(360,130,44,120),w(360,250,44,66,true),w(520,350,44,170),w(780,150,44,200),w(900,390,88,44)], [e(1080,120,'tactical'),e(1060,520,'tactical'),e(650,140,'tactical'),e(480,150,'patrol'),e(690,510,'patrol'),e(1000,300,'patrol'),e(880,530,'patrol'),e(590,240,'basic')], {
    lesson:'Abre la esquina de corcho desde un refugio y sal del callejón antes de la siguiente salva.', identity:'Un callejón de tres tramos, con compuerta inicial y dos rodeos permanentes.', changes:'Los tramos dejan salidas amplias; los defensores guardan el callejón y no copian las posiciones de la misión 31.',
    routes:[route('Rodeo alto',[220,90],[510,90],[890,120]),route('Rodeo bajo',[280,570],[670,570],[1080,570])],
  }),
  revise(33, at(170,170), [w(370,200,132,44),w(570,350,132,44),w(830,250,132,44),w(830,380,88,44,true),w(350,150,44,120)], [e(1080,150,'tactical'),e(1090,530,'tactical'),e(730,140,'tactical'),e(560,150,'patrol'),e(520,480,'patrol'),e(760,470,'patrol'),e(1010,360,'patrol'),e(700,270,'patrol')], {
    lesson:'Tras cada cruce cambia de refugio. Una cobertura no protege el siguiente tramo.', identity:'Tres cruces escalonados, cada uno con vigilancia y un borde de escape.', changes:'Se reparte la escolta entre los tres cruces y se alterna el inicio al norte para variar el orden de conquista.',
    routes:[route('Cruces por el norte',[250,90],[680,90],[1020,100]),route('Cruces por el sur',[210,530],[510,560],[790,560],[1080,450])],
  }),
  revise(34, at(170,320), [w(510,180,44,220),w(740,290,44,190),w(850,170,88,44),w(850,450,44,44,true),w(330,220,44,160)], [e(1070,130,'tactical'),e(1100,520,'tactical'),e(650,130,'tactical'),e(950,350,'tactical'),e(490,120,'patrol'),e(610,480,'patrol'),e(990,250,'patrol'),e(840,540,'patrol')], {
    lesson:'La tenaza tiene dos brazos. Usa el refugio inicial para elegir cuál romper primero.', identity:'Pinza desfasada con una cobertura inicial y dos escapes opuestos.', changes:'La cuarta defensa vigila el brazo derecho; la escolta móvil se reparte entre brazos y no cerca del inicio.',
    routes:[route('Brazo norte',[220,100],[590,100],[1000,120]),route('Brazo sur',[220,570],[690,570],[1060,570])],
  }),
  revise(35, at(170,500), [w(370,180,132,44),w(500,224,44,110),w(700,350,44,140),w(744,350,88,44,true),w(880,170,44,180),w(880,350,44,66,true),w(330,360,44,160)], [e(1100,130,'tactical'),e(1080,520,'tactical'),e(650,140,'tactical'),e(980,290,'tactical'),e(470,130,'patrol'),e(570,490,'patrol'),e(800,520,'patrol'),e(730,250,'patrol'),e(1020,440,'patrol')], {
    lesson:'Conserva una compuerta como escudo mientras abres la otra y cambias de sector.', identity:'Ciudadela de dos compuertas y refugios en L, con defensas interiores y exteriores.', changes:'Las cuatro defensas tienen frentes distintos; cada patrulla protege una ruta o una compuerta concreta.',
    routes:[route('Borde exterior norte',[250,110],[620,100],[990,100]),route('Borde exterior sur',[370,560],[740,570],[1130,590])],
  }),
  revise(36, at(170,320), [w(370,170,44,170),w(540,350,44,150),w(760,180,44,160),w(880,400,44,88,true),w(610,170,88,44)], [e(1100,120,'tactical'),e(1110,520,'tactical'),e(850,530,'tactical'),e(650,270,'tactical'),e(1030,330,'tactical'),e(510,120,'patrol'),e(650,520,'patrol'),e(970,210,'patrol'),e(510,430,'basic')], {
    lesson:'Cinco vigías no deben ver el mismo ángulo. Provoca uno y reubícate tras la madera.', identity:'Cinco puestos de observación separados por columnas y un techo central.', changes:'Cinco centinelas se conservan como identidad, pero la escolta se reduce a cuatro y cada vigía tiene una aproximación posible.',
    routes:[route('Puestos del norte',[240,100],[570,90],[920,120]),route('Puestos del sur',[250,560],[740,570],[1070,580])],
  }),
  revise(37, at(170,500), [w(340,130,44,140),w(520,360,44,170),w(750,130,44,190),w(900,390,44,140),w(600,340,66,44,true)], [e(1080,130,'tactical'),e(1100,530,'tactical'),e(650,140,'tactical'),e(1050,340,'tactical'),e(480,160,'patrol'),e(630,500,'patrol'),e(830,500,'patrol'),e(900,210,'patrol'),e(690,260,'patrol')], {
    lesson:'Los dientes alternados sirven para cortar salvas. Cambia de carril antes del siguiente tiro.', identity:'Una sierra de columnas alternadas, con enlaces anchos por arriba y abajo.', changes:'Los dientes dejan cruces transitables; los enemigos defienden pasillos distintos y hay dos puntos de retirada.',
    routes:[route('Dientes por arriba',[230,90],[550,100],[880,100]),route('Dientes por abajo',[300,570],[690,570],[1070,570])],
  }),
  revise(38, at(170,170), [w(520,190,88,44),w(700,370,88,44),w(520,234,44,110),w(744,260,44,110),w(860,170,44,110,true),w(360,140,44,150)], [e(1110,130,'tactical'),e(1100,520,'tactical'),e(650,120,'tactical'),e(1010,330,'tactical'),e(430,470,'patrol'),e(640,520,'patrol'),e(920,480,'patrol'),e(690,270,'patrol'),e(990,190,'patrol')], {
    lesson:'El nudo tiene dos extremos. Aísla una mitad antes de abrir el cruce central.', identity:'Dos eles enfrentadas y una ventana de corcho alrededor del nudo.', changes:'Inicio alto y defensores independientes por sector; las cavidades laterales evitan que el centro sea una autopista.',
    routes:[route('Extremo norte',[230,100],[700,90],[950,100]),route('Extremo sur',[250,530],[740,570],[1130,590])],
  },[hole(630,340),hole(674,340)]),
  revise(39, at(170,500), [w(370,170,44,200),w(540,390,44,120),w(740,120,44,200),w(890,360,44,170),w(540,324,44,66,true),w(890,294,44,66,true)], [e(1100,120,'tactical'),e(1100,530,'tactical'),e(650,160,'tactical'),e(1020,330,'tactical'),e(470,130,'patrol'),e(650,510,'patrol'),e(830,520,'patrol'),e(940,230,'patrol'),e(600,270,'patrol')], {
    lesson:'Gana una compuerta, úsala como refugio y encadena el ataque hacia la siguiente.', identity:'Asedio de dos compuertas en serie, con cuatro defensas en sectores separados.', changes:'Se reparte la formación entre sectores; el jugador siempre conserva un rodeo aunque las dos compuertas sigan cerradas.',
    routes:[route('Asedio norte',[240,90],[610,90],[950,100]),route('Asedio sur',[300,570],[720,570],[1130,590])],
  }),
  revise(40, at(170,500), [w(370,170,44,160),w(540,350,44,180),w(740,120,44,180),w(890,380,44,150),w(540,284,44,66,true),w(890,314,44,66,true),w(820,210,88,44),w(620,430,88,44,true)], [e(1110,120,'tactical'),e(1110,530,'tactical'),e(650,140,'tactical'),e(1030,330,'tactical'),e(490,130,'patrol'),e(650,530,'patrol'),e(830,500,'patrol'),e(960,220,'patrol'),e(630,270,'patrol')], {
    lesson:'Domina un sector antes de avanzar. Combina refugios, compuertas, salvas y retirada.', identity:'Examen de mando: tres sectores enlazados, cuatro defensas y una compuerta transversal opcional.', changes:'Nueve enemigos con tareas y posiciones propias reemplazan el grupo repetido de doce; cada sector tiene acceso y retirada.',
    routes:[route('Mando por el norte',[250,100],[570,90],[940,120]),route('Mando por el sur',[340,570],[750,570],[1110,580])],
  }),
];
