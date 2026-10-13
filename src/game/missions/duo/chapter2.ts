import { block as w, enemy as e } from '../shared';
import { at, type DuoPlan } from './design';
export const duoChapter2: DuoPlan[] = [
  {id:11,starts:[at(180,160),at(200,490)],extras:[e(1040,350,'patrol'),e(750,550,'basic')],cover:[w(310,310,88,44)],rally:at(710,370),
    lesson:'Sostengan las dos ramas y ayuden al compañero desde el enlace, sin cerrar su retirada.',roles:['P1 · rama norte','P2 · rama sur'],changes:'La bifurcación conserva dos frentes; el enlace gana refugio y guardias de salida para que el equipo elija dónde concentrarse.'},
  {id:12,starts:[at(170,170),at(180,510)],extras:[e(950,300,'patrol'),e(650,160,'basic')],cover:[w(440,290,88,44)],rally:at(710,320),
    lesson:'Alternen los cruces del zigzag: uno avanza y el otro espera con un carril libre.',roles:['P1 · zigzag protegido','P2 · enlace por el borde inferior'],changes:'P2 empieza en una salida inferior propia; el nuevo refugio antes del segundo giro permite alternar avances.'},
  {id:13,starts:[at(180,140),at(180,500)],extras:[e(760,500,'patrol'),e(1090,310,'basic')],cover:[w(290,330,88,44),w(300,430,44,110)],rally:at(780,390),
    lesson:'No rompan dos refugios a la vez. Uno sostiene la L mientras el otro abre el siguiente frente.',roles:['P1 · sostener la L superior','P2 · abrir la L inferior'],changes:'Un punto de enlace protegido y escolta entre las dos eles dan valor a conservar corcho mientras el compañero rota.'},
  {id:14,starts:[at(140,150),at(180,500)],extras:[e(920,380,'patrol'),e(1090,150,'basic')],cover:[w(330,310,88,44),w(300,130,44,100)],rally:at(850,330),
    lesson:'Ataquen los dos brazos de la pinza, pero mantengan un extremo disponible para reagruparse.',roles:['P1 · romper el brazo alto','P2 · contener el brazo bajo'],changes:'El refugio del enlace protege la retirada; los refuerzos guardan extremos distintos de la pinza.'},
  {id:15,starts:[at(180,150),at(180,500)],extras:[e(900,340,'patrol'),e(750,550,'basic')],cover:[w(280,290,88,44),w(300,130,44,100),w(300,430,44,90)],rally:at(980,360),
    lesson:'Rodeen las islas en sentidos complementarios y reúnanse fuera de las cavidades.',roles:['P1 · circuito norte','P2 · circuito sur'],changes:'Los circuitos conservan el centro bloqueado; el refugio de salida y los refuerzos laterales reparten el combate entre ambos.'},
  {id:16,starts:[at(180,130),at(180,350)],extras:[e(820,100,'tactical')],cover:[],rally:at(340,270),bankTargets:[0,1,2,3].map(enemy=>({from:at(180,300),enemy})),
    lesson:'Compartan la galería sin cruzar salvas: alternen señuelo y rebote desde puestos separados.',roles:['P1 · puesto alto de la galería','P2 · puesto bajo de la galería'],changes:'Dos puestos separados permanecen dentro de la zona restringida; cuatro centinelas y una ampliación moderada conservan rebotes dentro de la vida del misil.'},
  {id:17,starts:[at(180,140),at(180,510)],extras:[e(830,490,'patrol'),e(1100,330,'basic')],cover:[w(280,300,88,44),w(380,430,44,90)],rally:at(700,400),
    lesson:'P1 revela la emboscada; P2 cubre su retirada desde la esquina opuesta.',roles:['P1 · reconocer la emboscada','P2 · sostener la retirada diagonal'],changes:'El enlace de las eles gana un refugio y dos guardias de sector; ninguno aparece dentro de la salida del compañero.'},
  {id:18,starts:[at(170,170),at(180,520)],extras:[e(600,260,'patrol'),e(950,520,'basic'),e(1090,330,'patrol')],cover:[w(260,330,66,44)],rally:at(690,440),
    lesson:'Elijan una fortaleza para concentrar el fuego; el compañero conserva el camino hacia la otra.',roles:['P1 · presión sobre la fortaleza alta','P2 · apoyo por el asalto bajo'],changes:'Tres refuerzos protegen conexiones entre fortalezas, no forman una fila idéntica; la madera lateral cubre el cambio de objetivo.'},
  {id:19,starts:[at(180,150),at(180,510)],extras:[e(920,330,'patrol'),e(1100,400,'basic'),e(610,520,'patrol')],cover:[w(290,290,88,44),w(300,430,44,110)],rally:at(730,360),
    lesson:'Dividan la vigilancia de los puestos y cambien el señuelo tras cada salva rápida.',roles:['P1 · vigilar puestos altos','P2 · enlazar puestos bajos'],changes:'Un refugio de enlace permite relevos; la escolta móvil se reparte entre ambos flancos sin añadir centinelas al inicio.'},
  {id:20,starts:[at(170,140),at(170,510)],extras:[e(840,330,'patrol'),e(1090,350,'patrol'),e(590,540,'basic')],cover:[w(270,330,88,44)],rally:at(810,390),
    lesson:'Alternen avance y cobertura en cada sector; reagrúpense antes de romper la última puerta.',roles:['P1 · avance por el frente norte','P2 · apoyo por el frente sur'],changes:'El examen añade defensores de enlace y una cobertura de relevo, con una fuerza elegida expresamente para la pareja.'},
];
