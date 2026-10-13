import { block as w, enemy as e } from '../shared';
import { at, hole, post, revise, route } from './design';
export const soloChapter1 = [
  revise(1, at(180,520), [w(610,265,44,150)], [e(1030,170,'basic')], {
    lesson:'Rodea la cobertura y alinea la torreta antes de disparar.', identity:'Una barrera central, un explorador y dos flancos abiertos.', changes:'Se conserva el duelo introductorio y se retiran cavidades que distraían del movimiento.',
    routes:[route('Flanco norte',[180,190],[520,190],[760,190]),route('Flanco sur',[400,520],[740,520],[950,420])],
  }),
  revise(2, at(180,520), [w(390,340,176,44),w(780,390,176,44)], [e(1040,160,'basic'),e(1040,500,'basic')], {
    lesson:'Despeja una esquina y cambia de cobertura antes de ir a la otra.', identity:'Dos esquinas defendidas y coberturas escalonadas.', changes:'Los refugios interceptan las líneas iniciales; los dos exploradores guardan extremos diferentes.',
    routes:[route('Esquina norte',[240,190],[670,230],[1010,270]),route('Esquina sur',[650,520],[740,480],[1030,560])],
  }),
  revise(3, at(180,500), [w(450,100,44,210),w(790,370,44,180)], [e(1040,150,'patrol'),e(960,500,'basic')], {
    lesson:'El patrullero se mueve: adelanta el tiro y conserva una salida.', identity:'Dos muros alternados; un blanco móvil y un guardia de apoyo.', changes:'Debut del patrullero sin cavidades; paso central ancho para esquivar y cambiar de flanco.',
    routes:[route('Paso central',[300,350],[650,350],[1000,300]),route('Rodeo inferior',[500,570],[900,570],[1050,440])],
  }),
  revise(4, at(180,520), [w(430,220,44,240),w(790,100,44,230),w(580,350,120,44)], [e(650,170,'basic'),e(1080,150,'basic'),e(1030,500,'patrol')], {
    lesson:'Un rebote permite atacar una esquina sin cruzar su línea de fuego.', identity:'Barreras desfasadas que ofrecen rebotes y un rodeo directo más largo.', changes:'Se ensanchan los pasos inferior y central; se define un puesto para practicar el rebote.',
    routes:[route('Puesto de rebote',[300,520],[330,520]),route('Rodeo directo',[180,160],[610,100],[970,380])], bankTargets:[{from:post(330,520),enemy:0}],
  }),
  revise(5, at(190,500), [w(430,170,44,220),w(430,390,44,88,true),w(430,478,44,52),w(790,190,44,66,true),w(790,256,44,210)], [e(650,160,'patrol'),e(1040,500,'patrol'),e(1050,140,'basic')], {
    lesson:'Tres impactos rompen el corcho. Decide entre abrir un atajo o rodear.', identity:'Dos compuertas de corcho, con rodeos que siempre permanecen abiertos.', changes:'La primera compuerta conecta dos tramos de madera y abre un atajo real; ambos rodeos permanecen disponibles.',
    routes:[route('Rodeo norte',[280,120],[580,100],[730,140]),route('Rodeo sur',[300,550],[650,550],[1000,550])],
  }),
  revise(6, at(190,490), [w(330,220,150,44),w(650,410,150,44),w(920,170,44,160)], [e(1020,510,'patrol'),e(1080,120,'patrol'),e(650,160,'patrol')], {
    lesson:'Las cavidades bloquean el paso, pero los misiles las cruzan. Esquiva por los lados.', identity:'Tres patrulleros presionan flancos de una franja de cavidades.', changes:'Primera lección explícita de cavidades; se concentran en el cruce central y no detrás del jugador.',
    routes:[route('Borde norte',[180,140],[540,140],[830,140]),route('Borde sur',[400,520],[850,520],[1050,410])],
  },[hole(630,300),hole(674,300),hole(718,300)]),
  revise(7, at(190,500), [w(390,300,44,170),w(620,190,44,180),w(910,170,44,230)], [e(1080,220,'tactical'),e(730,130,'basic')], {
    lesson:'El centinela intercepta misiles. Provoca su tiro y ataca durante su recarga.', identity:'Una primera posición fortificada y dos caminos para cambiar el ángulo de ataque.', changes:'Un solo centinela y un explorador de apoyo: se aprende la contraofensiva antes de añadir patrulleros.',
    routes:[route('Flanco alto',[180,150],[530,120],[850,100]),route('Flanco bajo',[530,520],[810,470],[1070,470])], bankTargets:[{from:post(810,470),enemy:0}],
  }),
  revise(8, at(175,500), [w(310,130,44,230),w(520,330,44,210),w(730,130,44,220),w(940,340,44,180)], [e(460,170,'patrol'),e(850,500,'tactical'),e(1060,150,'patrol'),e(1080,500,'basic')], {
    lesson:'Avanza entre coberturas; revisa la siguiente salida antes de abandonar la anterior.', identity:'Un laberinto abierto con corredores alternados y un centinela al final.', changes:'Se retiran huecos decorativos; las alternancias mantienen pasos de al menos dos diámetros de tanque.',
    routes:[route('Escalera central',[260,410],[450,300],[670,270],[850,240]),route('Anillo exterior',[180,100],[650,90],[1090,90],[1120,400])],
  }),
  revise(9, at(190,500), [w(400,210,132,44),w(748,210,132,44),w(400,430,132,44),w(748,430,132,44),w(616,300,44,66,true)], [e(1080,140,'tactical'),e(1080,520,'tactical'),e(630,130,'patrol'),e(670,530,'patrol')], {
    lesson:'No enfrentes las dos torretas a la vez: usa las cuatro coberturas para aislar un sector.', identity:'Un cruce con dos posiciones defensivas y cuatro refugios.', changes:'Los centinelas guardan sectores opuestos; se conserva un borde lateral para escapar del cruce.',
    routes:[route('Sector norte',[260,140],[660,190],[970,290]),route('Sector sur',[650,540],[950,540],[1040,400])],
  }),
  revise(10, at(170,500), [w(350,170,44,175),w(550,380,44,150),w(700,140,44,175),w(890,360,44,160),w(550,314,44,66,true),w(890,294,44,66,true)], [e(1080,130,'tactical'),e(1080,520,'tactical'),e(860,190,'patrol'),e(690,510,'patrol'),e(500,150,'basic')], {
    lesson:'Combina flancos, corcho y salvas; conquista una mitad del tablero antes de la siguiente.', identity:'Examen del taller: dos defensas detrás de muros escalonados.', changes:'Se eliminan cavidades sin lección propia y se reservan rutas exteriores para reposicionarse.',
    routes:[route('Media vuelta norte',[220,100],[510,100],[850,100]),route('Media vuelta sur',[400,560],[780,560],[1100,570])],
  }),
];
