import { block as w, enemy as e } from '../shared';
import { at, hole, revise, route } from './design';
export const soloChapter3 = [
  revise(21, at(180,320), [w(360,160,176,44),w(744,420,176,44),w(600,260,44,176),w(744,354,44,66,true),w(330,250,44,140)], [e(940,330,'hunter'),e(1080,130,'basic'),e(1080,520,'basic')], {
    lesson:'El cazador busca tu flanco. Cambia de esquina, provoca su contratiro y ataca mientras recarga.', identity:'Una pieza central divide dos líneas de corte en sectores norte y sur.', changes:'Debut del cazador con dos exploradores de escolta: los bordes permiten reconocer su rodeo, cambiar el ángulo de ataque y aprovechar su recuperación.',
    routes:[route('Sector alto',[260,100],[590,100],[890,120]),route('Sector bajo',[260,550],[550,550],[960,570])],
  }),
  revise(22, at(180,500), [w(380,180,88,88),w(620,340,88,88),w(860,180,88,88),w(468,224,88,44,true),w(708,384,88,44,true),w(360,420,44,130)], [e(1090,140,'tactical'),e(1020,330,'hunter'),e(740,150,'patrol'),e(560,500,'patrol'),e(900,520,'basic')], {
    lesson:'Las pilas cortan la visión del cazador. Cambia de caja y aprovecha su recuperación antes de avanzar.', identity:'Tres pilas escalonadas forman una cadena de refugios y dos circuitos.', changes:'Un cazador ocupa el enlace oriental y sustituye escolta repetida; un centinela controla el frente alto y dos patrullas permiten elegir circuito.',
    routes:[route('Cadena superior',[260,110],[600,110],[790,300],[1050,300]),route('Cadena inferior',[450,560],[750,530],[1070,450])],
  }),
  revise(23, at(170,170), [w(320,130,44,240),w(550,320,44,210),w(790,130,44,240),w(1010,420,88,44,true)], [e(1040,140,'tactical'),e(1110,520,'tactical'),e(700,510,'patrol'),e(950,360,'patrol'),e(650,160,'basic')], {
    lesson:'Descansa del cazador: lee el zigzag y cruza cuando los dos centinelas hayan gastado su salva.', identity:'Tres dientes alternados y una compuerta lateral, con pasos de escape amplios.', changes:'Pausa de cazadores: cinco enemigos repartidos por dientes y extremos, con un cruce central vigilado por el explorador.',
    routes:[route('Zigzag',[230,430],[470,430],[690,270],[960,290]),route('Ruta exterior',[180,560],[480,580],[860,570],[1150,570])],
  }),
  revise(24, at(180,500), [w(400,200,132,44),w(748,200,132,44),w(400,440,132,44),w(748,440,132,44),w(610,300,66,88,true),w(350,400,44,130)], [e(1080,140,'tactical'),e(1080,520,'tactical'),e(980,290,'hunter'),e(510,340,'patrol'),e(570,140,'basic')], {
    lesson:'La bisagra abre diagonales al cazador. Rodea un extremo y rompe el corcho cuando domines la retirada.', identity:'Cuatro apoyos alrededor de una bisagra destructible.', changes:'Un cazador vigila el brazo oriental; dos centinelas fijan extremos y la escolta interior deja libre la elección del giro.',
    routes:[route('Giro norte',[250,120],[590,180],[940,180]),route('Giro sur',[300,560],[700,580],[1000,570])],
  }),
  revise(25, at(180,320), [w(390,180,88,88),w(800,180,88,88),w(390,430,88,88),w(800,430,88,88),w(600,320,88,44,true)], [e(1070,130,'tactical'),e(1100,520,'tactical'),e(1030,310,'hunter'),e(650,540,'patrol'),e(540,120,'basic')], {
    lesson:'Usa un refugio para provocar el contratiro y otro para atacar al cazador mientras recarga.', identity:'Cuatro refugios separados con un corredor central de rotación.', changes:'Un cazador reemplaza dos vigilantes del centro: necesita rodear los refugios y deja ventanas para cambiar de ángulo.',
    routes:[route('Refugios del norte',[250,110],[570,180],[980,180]),route('Refugios del sur',[250,550],[730,580],[1020,570])],
  }),
  revise(26, at(180,500), [w(420,140,44,180),w(420,320,44,88,true),w(420,408,44,108),w(800,140,44,140),w(800,280,44,88,true),w(800,368,44,148)], [e(1080,120,'tactical'),e(1100,520,'tactical'),e(990,340,'hunter'),e(660,510,'patrol'),e(580,410,'patrol'),e(540,130,'basic')], {
    lesson:'Abre una puerta desde cobertura; el cazador puede usarla también. Conserva el rodeo exterior.', identity:'Dos compuertas en serie dividen el combate en tres sectores.', changes:'Un cazador parte del sector final y puede atravesar puertas abiertas; dos centinelas y tres escoltas dividen las líneas de avance.',
    routes:[route('Rodeo norte',[260,90],[640,100],[950,100]),route('Rodeo sur',[280,570],[650,570],[1030,570])],
  }),
  revise(27, at(180,330), [w(460,200,132,44),w(720,200,132,44),w(460,440,132,44),w(720,440,132,44),w(460,244,44,132),w(808,308,44,132),w(620,320,66,44,true)], [e(1070,130,'tactical'),e(1100,520,'tactical'),e(1030,330,'hunter'),e(670,530,'patrol'),e(580,270,'patrol'),e(560,110,'basic')], {
    lesson:'Atrae al cazador hacia una entrada del anillo y sal por la otra antes de contraatacar.', identity:'Anillo incompleto con dos entradas enfrentadas y bisagra interior.', changes:'Un cazador patrulla el frente derecho del anillo; la escolta se reduce y conserva una vigilancia distinta en cada entrada.',
    routes:[route('Anillo norte',[300,100],[710,90],[1000,170]),route('Anillo sur',[300,550],[650,580],[1000,550])],
  }),
  revise(28, at(180,500), [w(350,170,176,44),w(482,214,44,110),w(790,390,176,44),w(790,280,44,110),w(620,300,88,44,true),w(410,400,44,150)], [e(1100,130,'tactical'),e(1100,530,'tactical'),e(960,250,'hunter'),e(620,530,'patrol'),e(560,240,'patrol')], {
    lesson:'La ele corta su visión, pero el cazador recuerda tu última esquina. Cambia de diagonal antes de disparar.', identity:'Dos eles opuestas y una unión central destructible.', changes:'El cazador ocupa la diagonal oriental; se reducen tres escoltas y una defensa para que el reto sea cambiar de esquina.',
    routes:[route('Diagonal norte',[250,120],[660,240],[990,150]),route('Diagonal sur',[380,560],[750,550],[1090,480])],
  }),
  revise(29, at(180,320), [w(360,170,44,180),w(580,390,44,130),w(720,120,44,200),w(940,370,44,150),w(580,324,44,66,true),w(940,304,44,66,true)], [e(1110,130,'tactical'),e(1110,530,'tactical'),e(830,520,'tactical'),e(980,220,'hunter'),e(510,440,'patrol'),e(1080,330,'basic')], {
    lesson:'Provoca el contratiro del cazador sin exponerte a los centinelas; cambia de ventana durante su recarga.', identity:'Tres defensas apoyadas por columnas desfasadas y dos ventanas de corcho.', changes:'Tres centinelas conservan frentes separados; un cazador reemplaza patrullas redundantes en el enlace superior derecho.',
    routes:[route('Ventana norte',[240,100],[620,90],[950,120]),route('Ventana sur',[260,570],[730,570],[1110,580])],
  }),
  revise(30, at(170,500), [w(350,180,44,160),w(550,400,44,130),w(740,120,44,200),w(930,390,44,140),w(550,334,44,66,true),w(930,324,44,66,true),w(580,210,88,44),w(810,440,88,44,true)], [e(1100,130,'tactical'),e(1110,530,'tactical'),e(1000,230,'hunter'),e(670,520,'hunter'),e(460,130,'patrol'),e(650,140,'basic')], {
    lesson:'Dos cazadores cubren flancos distintos. Aísla uno tras la madera antes de entrar al siguiente sector.', identity:'Examen de tres sectores con corredores exteriores que enlazan cada conquista.', changes:'Primera pareja de cazadores, con puestos alto y bajo separados; dos centinelas y dos escoltas completan seis enemigos.',
    routes:[route('Conquista norte',[220,100],[510,100],[870,100]),route('Conquista sur',[380,570],[750,570],[1130,590])],
  }),
];
