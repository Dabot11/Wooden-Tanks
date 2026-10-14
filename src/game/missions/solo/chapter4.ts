import { block as w, enemy as e } from '../shared';
import { at, hole, post, revise, route } from './design';
export const soloChapter4 = [
  revise(31, at(170,320), [w(360,200,44,190),w(560,340,88,44),w(750,180,44,220),w(930,280,44,88,true)], [e(1060,130,'tactical'),e(1110,500,'tactical'),e(820,520,'tactical'),e(1040,230,'hunter'),e(570,130,'patrol'),e(550,500,'patrol')], {
    lesson:'El bastión tiene tres defensas y un cazador de enlace. Gana un flanco antes de buscar el rebote.', identity:'Dos muros verticales y una bisagra baja protegen tres puestos escalonados.', changes:'Tres centinelas conservan el bastión; un cazador cubre el enlace derecho y solo dos patrullas sostienen las aproximaciones.',
    routes:[route('Flanco del bastión norte',[220,100],[600,100],[930,170]),route('Flanco del bastión sur',[250,550],[710,550],[1050,580])], bankTargets:[{from:post(710,550),enemy:0}],
  }),
  revise(32, at(170,500), [w(360,130,44,120),w(360,250,44,66,true),w(520,350,44,170),w(780,150,44,200),w(900,390,88,44)], [e(1080,120,'tactical'),e(1060,520,'tactical'),e(1000,300,'hunter'),e(690,510,'hunter'),e(480,150,'patrol'),e(880,530,'patrol')], {
    lesson:'Dos cazadores rondan el callejón. Mantén un rodeo libre y abre la salida antes de atraerlos.', identity:'Un callejón de tres tramos, con compuerta inicial y dos rodeos permanentes.', changes:'Dos cazadores sustituyen tres escoltas y una defensa; los extremos mantienen centinelas y las patrullas guardan salidas opuestas.',
    routes:[route('Rodeo alto',[220,90],[510,90],[890,120]),route('Rodeo bajo',[280,570],[670,570],[1080,570])],
  }),
  revise(33, at(170,170), [w(370,200,132,44),w(570,350,132,44),w(830,250,132,44),w(830,380,88,44,true),w(350,150,44,120)], [e(1080,150,'tactical'),e(1090,530,'tactical'),e(730,140,'tactical'),e(1010,360,'hunter'),e(760,470,'hunter'),e(560,150,'patrol')], {
    lesson:'Cruza tras la recarga: un cazador guarda el enlace y otro la salida. Cambia de refugio tras cada tiro.', identity:'Tres cruces escalonados, cada uno con vigilancia y un borde de escape.', changes:'Dos cazadores en sectores distintos y tres centinelas dan función a los cruces; una patrulla basta para vigilar el acceso alto.',
    routes:[route('Cruces por el norte',[250,90],[680,90],[1020,100]),route('Cruces por el sur',[210,530],[510,560],[790,560],[1080,450])],
  }),
  revise(34, at(170,320), [w(510,180,44,220),w(740,290,44,190),w(850,170,88,44),w(850,450,44,44,true),w(330,220,44,160)], [e(1070,130,'tactical'),e(1100,520,'tactical'),e(950,350,'tactical'),e(990,250,'hunter'),e(610,480,'hunter'),e(490,120,'patrol')], {
    lesson:'Rompe un brazo de la tenaza, atrae allí a un cazador y aprovecha la retirada antes de enfrentar al otro.', identity:'Pinza desfasada con una cobertura inicial y dos escapes opuestos.', changes:'Dos cazadores ocupan brazos opuestos; tres centinelas y una patrulla sustituyen las cuatro defensas con escolta repetida.',
    routes:[route('Brazo norte',[220,100],[590,100],[1000,120]),route('Brazo sur',[220,570],[690,570],[1060,570])],
  }),
  revise(35, at(170,500), [w(370,180,132,44),w(500,224,44,110),w(700,350,44,140),w(744,350,88,44,true),w(880,170,44,180),w(880,350,44,66,true),w(330,360,44,160)], [e(1100,130,'tactical'),e(1080,520,'tactical'),e(650,140,'tactical'),e(980,290,'tactical'),e(1020,440,'hunter'),e(800,520,'hunter')], {
    lesson:'Una compuerta abierta, otra como escudo. Evita que los dos cazadores te alcancen desde sectores distintos.', identity:'Ciudadela de dos compuertas y refugios en L, con defensas interiores y exteriores.', changes:'Los cuatro centinelas conservan la ciudadela; dos cazadores de enlace sustituyen las cinco patrullas sin invadir el inicio.',
    routes:[route('Borde exterior norte',[250,110],[620,100],[990,100]),route('Borde exterior sur',[370,560],[740,570],[1130,590])],
  }),
  revise(36, at(170,320), [w(370,170,44,170),w(540,350,44,150),w(760,180,44,160),w(880,400,44,88,true),w(610,170,88,44)], [e(1100,120,'tactical'),e(1110,520,'tactical'),e(850,530,'tactical'),e(650,270,'tactical'),e(1030,330,'tactical'),e(970,210,'hunter'),e(650,520,'patrol')], {
    lesson:'Los cinco vigías fijan los ángulos y un cazador busca el espacio entre ellos. Provoca una defensa y reubícate.', identity:'Cinco puestos de observación separados por columnas y un techo central.', changes:'Se mantienen los cinco centinelas como identidad; un cazador y una patrulla sustituyen cuatro escoltas para limitar el fuego simultáneo.',
    routes:[route('Puestos del norte',[240,100],[570,90],[920,120]),route('Puestos del sur',[250,560],[740,570],[1070,580])],
  }),
  revise(37, at(170,500), [w(340,130,44,140),w(520,360,44,170),w(750,130,44,190),w(900,390,44,140),w(600,340,66,44,true)], [e(1080,130,'tactical'),e(1100,530,'tactical'),e(1050,340,'tactical'),e(900,210,'hunter'),e(830,500,'hunter'),e(480,160,'patrol'),e(630,500,'patrol')], {
    lesson:'Los dientes cortan la visión de dos cazadores. Cambia de carril y evita volver a su última línea de tiro.', identity:'Una sierra de columnas alternadas, con enlaces anchos por arriba y abajo.', changes:'Dos cazadores rondan dientes opuestos; tres centinelas y dos patrullas conservan vigilancia sin llenar cada pasillo.',
    routes:[route('Dientes por arriba',[230,90],[550,100],[880,100]),route('Dientes por abajo',[300,570],[690,570],[1070,570])],
  }),
  revise(38, at(170,170), [w(520,190,88,44),w(700,370,88,44),w(520,234,44,110),w(744,260,44,110),w(860,170,44,110,true),w(360,140,44,150)], [e(1110,130,'tactical'),e(1100,520,'tactical'),e(1010,330,'tactical'),e(990,190,'hunter'),e(920,480,'hunter'),e(430,470,'patrol'),e(640,520,'patrol')], {
    lesson:'Aísla una mitad del nudo: cada cazador parte de un extremo y las cavidades limitan el escape por el centro.', identity:'Dos eles enfrentadas y una ventana de corcho alrededor del nudo.', changes:'Un cazador por extremo reemplaza escolta y una defensa; tres centinelas y dos patrullas guardan conexiones concretas.',
    routes:[route('Extremo norte',[230,100],[700,90],[950,100]),route('Extremo sur',[250,530],[740,570],[1130,590])],
  },[hole(630,340),hole(674,340)]),
  revise(39, at(170,500), [w(370,170,44,200),w(540,390,44,120),w(740,120,44,200),w(890,360,44,170),w(540,324,44,66,true),w(890,294,44,66,true)], [e(1100,120,'tactical'),e(1100,530,'tactical'),e(650,160,'tactical'),e(1020,330,'tactical'),e(940,230,'hunter'),e(830,520,'hunter'),e(470,130,'patrol')], {
    lesson:'Gana una compuerta y úsala para separar a los cazadores. Conquista un sector antes de abrir el siguiente.', identity:'Asedio de dos compuertas en serie, con cuatro defensas en sectores separados.', changes:'Cuatro centinelas y dos cazadores defienden sectores diferentes; solo una patrulla guarda el acceso alto del asedio.',
    routes:[route('Asedio norte',[240,90],[610,90],[950,100]),route('Asedio sur',[300,570],[720,570],[1130,590])],
  }),
  revise(40, at(170,500), [w(370,170,44,160),w(540,350,44,180),w(740,120,44,180),w(890,380,44,150),w(540,284,44,66,true),w(890,314,44,66,true),w(820,210,88,44),w(620,430,88,44,true)], [e(1110,120,'tactical'),e(1110,530,'tactical'),e(650,140,'tactical'),e(1030,330,'tactical'),e(960,220,'hunter'),e(830,500,'hunter'),e(490,130,'patrol')], {
    lesson:'Examen de mando: separa a los cazadores, provoca defensas y conquista los tres sectores con una retirada preparada.', identity:'Examen de mando: tres sectores enlazados, cuatro defensas y una compuerta transversal opcional.', changes:'Siete enemigos especializados sustituyen nueve: cuatro centinelas, dos cazadores y una patrulla, con accesos y retiradas por sector.',
    routes:[route('Mando por el norte',[250,100],[570,90],[940,120]),route('Mando por el sur',[340,570],[750,570],[1110,580])],
  }),
];
