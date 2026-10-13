import { block as w, enemy as e } from '../shared';
import { at, hole, post, revise, route } from './design';
export const soloChapter2 = [
  revise(11, at(180,320), [w(420,130,44,170),w(420,380,44,170),w(820,270,44,240),w(620,270,88,44,true)], [e(1040,130,'tactical'),e(1030,520,'patrol'),e(650,140,'patrol'),e(670,510,'basic')], {
    lesson:'Dos frentes, una retirada central. Limpia primero el lado que te dé más espacio.', identity:'Inicio entre una bifurcación superior y otra inferior.', changes:'El jugador empieza a media altura; el capítulo introduce decisiones de frente en vez de repetir la esquina inferior.',
    routes:[route('Frente norte',[260,90],[600,90],[940,190]),route('Frente sur',[260,580],[650,570],[1030,580])],
  }),
  revise(12, at(170,170), [w(340,100,44,260),w(570,340,44,190),w(820,110,44,250),w(980,440,132,44,true)], [e(500,150,'patrol'),e(730,520,'patrol'),e(1060,160,'tactical'),e(1100,550,'basic')], {
    lesson:'Mira la salida del siguiente giro; las cavidades no te protegen de los disparos.', identity:'Una ruta de escape en zigzag iniciada desde el norte.', changes:'Se alterna el punto de inicio y se sitúan cavidades fuera del pasillo mínimo de escape.',
    routes:[route('Zigzag seguro',[250,420],[470,420],[650,290],[900,390]),route('Borde inferior',[180,560],[480,580],[800,570],[1150,570])],
  },[hole(700,200),hole(700,244),hole(1100,320)]),
  revise(13, at(180,500), [w(380,200,132,44),w(380,244,44,132),w(610,350,132,44,true),w(610,394,44,88),w(850,150,44,210),w(894,150,132,44,true)], [e(520,140,'patrol'),e(550,510,'patrol'),e(1110,130,'tactical'),e(1000,450,'tactical'),e(750,260,'basic')], {
    lesson:'Abrir el corcho también abre una línea enemiga. Elige qué compuerta romper primero.', identity:'Dos refugios en L y compuertas que cambian los ángulos de combate.', changes:'La defensa baja gana un centinela; el corcho une coberturas útiles y el perímetro evita encerrarse.',
    routes:[route('L superior',[250,130],[680,130],[810,100]),route('L inferior',[400,560],[780,560],[1090,540])],
  }),
  revise(14, at(180,320), [w(510,210,44,230),w(760,210,44,230),w(642,210,44,44,true),w(570,430,176,44,true)], [e(970,130,'patrol'),e(1050,520,'patrol'),e(1080,280,'tactical'),e(650,330,'patrol'),e(410,120,'basic')], {
    lesson:'Una pinza pierde fuerza si mantienes abierto un extremo y cambias de frente.', identity:'Dos pinzas verticales con salidas por arriba y abajo.', changes:'El inicio lateral central permite elegir el lado; se mantienen ambos rodeos aunque el corcho siga entero.',
    routes:[route('Salida norte',[250,100],[680,100],[950,170]),route('Salida sur',[250,570],[660,540],[1000,560])],
  }),
  revise(15, at(180,500), [w(400,180,88,88),w(690,180,88,88),w(400,410,88,88),w(690,410,88,88),w(488,224,88,44,true),w(778,410,88,44,true)], [e(580,130,'patrol'),e(580,550,'patrol'),e(1050,140,'tactical'),e(1050,520,'tactical'),e(940,290,'basic')], {
    lesson:'Rota alrededor de las islas; evita quedar entre una cobertura y una cavidad.', identity:'Cuatro islas con una zona central transitable por sus dos bordes.', changes:'Las cavidades centrales conservan su función; se documentan dos circuitos completos de aproximación.',
    routes:[route('Circuito norte',[260,120],[630,100],[970,150]),route('Circuito sur',[300,570],[650,570],[1030,570])],
  },[hole(600,300,17),hole(642,300,17),hole(600,342,17),hole(642,342,17)]),
  revise(16, at(180,300), [w(500,44,44,390)], [e(900,170,'tactical'),e(1000,300,'tactical'),e(850,350,'tactical')], {
    lesson:'Tu zona es limitada. Provoca el tiro y devuelve una salva con rebote por la pared inferior.', identity:'Galería de tiro: barrera de movimiento que deja pasar los misiles.', changes:'Se conserva la geometría del rompecabezas; cada centinela tiene un rebote real comprobado dentro de la vida del misil.',
    routes:[route('Puesto alto',[180,130],[330,180]),route('Puesto bajo',[180,390],[390,390])], bankTargets:[0,1,2].map(enemy=>({from:at(180,300),enemy})),
  },[...Array.from({length:19},(_,i)=>hole(60+i*24,450)),...Array.from({length:8},(_,i)=>hole(522,450+i*24))],true),
  revise(17, at(180,510), [w(370,170,176,44),w(502,214,44,132),w(770,370,176,44),w(770,238,44,132),w(610,290,88,44,true),w(300,370,44,100)], [e(650,140,'tactical'),e(980,150,'patrol'),e(1110,500,'patrol'),e(620,520,'patrol'),e(1000,290,'tactical'),e(490,400,'basic')], {
    lesson:'Asómate por una esquina, atrae al patrullero y retrocede a una salida conocida.', identity:'Dos esquinas en L ocultan una emboscada y una retirada diagonal.', changes:'El guardia más cercano se aleja del inicio; la esquina inferior conserva una salida hacia el perímetro.',
    routes:[route('Reconocimiento norte',[250,120],[650,220],[920,110]),route('Retirada sur',[360,550],[680,550],[1070,550])],
  }),
  revise(18, at(170,170), [w(350,150,44,190),w(350,340,88,44,true),w(590,340,44,190),w(850,150,44,190),w(894,150,88,44,true),w(850,430,176,44)], [e(530,140,'patrol'),e(720,520,'patrol'),e(1090,140,'tactical'),e(1080,540,'tactical'),e(710,170,'patrol'),e(1050,300,'basic')], {
    lesson:'Ataca una fortaleza por fuera y conserva la ruta hacia la otra.', identity:'Dos fortalezas con compuertas y un cruce de cavidades entre ellas.', changes:'Entrada desde el norte, guardias repartidos entre ambas defensas y retirada continua por los bordes.',
    routes:[route('Asalto alto',[220,90],[560,100],[760,100],[1060,90]),route('Asalto bajo',[180,430],[470,540],[760,570],[1080,580])],
  },[hole(690,310),hole(734,310),hole(1100,400)]),
  revise(19, at(180,330), [w(400,200,132,44),w(748,200,132,44),w(400,450,132,44),w(748,450,132,44),w(400,244,44,132),w(836,318,44,132),w(600,310,88,44,true)], [e(650,140,'tactical'),e(1100,140,'patrol'),e(1100,520,'tactical'),e(660,540,'patrol'),e(690,270,'patrol'),e(1010,410,'basic')], {
    lesson:'Un cerco se rompe por un sector. No entres al centro sin reservar una salida.', identity:'Un anillo incompleto deja elegir dos entradas laterales.', changes:'Se centra el inicio en el lateral libre; el guardia interior evita un tiro inicial a corta distancia.',
    routes:[route('Entrada norte',[260,120],[620,180],[1010,180]),route('Entrada sur',[260,550],[730,580],[1030,570])],
  }),
  revise(20, at(170,500), [w(340,180,44,180),w(520,390,44,140),w(710,120,44,200),w(890,390,44,140),w(520,324,44,66,true),w(890,324,44,66,true),w(580,200,88,44)], [e(1080,120,'tactical'),e(1110,530,'tactical'),e(800,520,'tactical'),e(980,220,'patrol'),e(670,510,'patrol'),e(580,130,'patrol'),e(450,110,'basic')], {
    lesson:'Recupera terreno detrás de cada compuerta y derrota las tres defensas por turnos.', identity:'Cierre del segundo capítulo: tres defensas y dos compuertas encadenadas.', changes:'Se elimina la fila de huecos heredada y se reubican los guardias para que cada compuerta tenga un sector propio.',
    routes:[route('Avance por el norte',[220,100],[510,100],[850,100]),route('Avance por el sur',[400,570],[750,570],[1130,590])],
  }),
];
