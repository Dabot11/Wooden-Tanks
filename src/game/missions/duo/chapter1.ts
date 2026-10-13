import { block as w, enemy as e } from '../shared';
import { at, type DuoPlan } from './design';
export const duoChapter1: DuoPlan[] = [
  {id:1,starts:[at(180,170),at(180,500)],extras:[e(1000,500,'basic')],cover:[w(410,310,88,44)],rally:at(540,460),
    lesson:'Cada tanque toma un flanco. Antes de cruzarse, dejen de disparar.',roles:['P1 · rodeo norte','P2 · rodeo sur'],changes:'Dos exploradores en extremos opuestos y un refugio de enlace enseñan flancos y fuego amigo sin saturación.'},
  {id:2,starts:[at(180,170),at(220,500)],extras:[e(690,160,'basic')],cover:[w(470,190,88,44)],rally:at(670,330),
    lesson:'Despejen las dos esquinas y reúnanse detrás de la cobertura central.',roles:['P1 · asegurar la esquina alta','P2 · asegurar la esquina baja'],changes:'Un tercer explorador cubre el enlace; una cobertura alta permite que P1 avance sin entrar en el carril de P2.'},
  {id:3,starts:[at(180,170),at(180,500)],extras:[e(690,180,'basic'),e(1090,380,'patrol')],cover:[w(580,250,88,44)],rally:at(680,350),
    lesson:'Uno vigila al patrullero mientras el otro cambia de flanco.',roles:['P1 · controlar el paso central','P2 · envolver por abajo'],changes:'El debut móvil recibe un segundo patrullero lateral y un explorador de enlace; el nuevo refugio corta el cruce central.'},
  {id:4,starts:[at(180,170),at(180,520)],extras:[e(940,320,'basic'),e(690,530,'patrol')],cover:[w(570,450,88,44)],rally:at(720,450),routeOrder:[1,0],
    lesson:'P2 practica el rebote; P1 atrae a la escolta desde el rodeo alto.',roles:['P1 · despejar el rodeo directo','P2 · sostener el puesto de rebote'],changes:'La cobertura baja permite sostener el rebote sin cortar la ruta alta; los refuerzos guardan enlaces, no los puntos de salida.'},
  {id:5,starts:[at(180,150),at(190,500)],extras:[e(640,500,'basic'),e(1060,310,'patrol')],cover:[w(570,290,88,44),w(330,130,44,100)],rally:at(600,550),
    lesson:'Uno rompe la compuerta; el otro vigila el rodeo. No abran ambos frentes a la vez.',roles:['P1 · vigilar el rodeo norte','P2 · abrir el primer sector'],changes:'La compuerta conserva su atajo; un refugio entre puertas y dos defensores separados permiten alternar apertura y vigilancia.'},
  {id:6,starts:[at(180,140),at(190,490)],extras:[e(900,480,'basic'),e(1030,330,'patrol')],cover:[w(470,390,88,44),w(300,430,44,110)],rally:at(820,360),
    lesson:'Rodeen las cavidades por lados distintos; no cubren de los misiles.',roles:['P1 · borde alto de las cavidades','P2 · borde bajo de las cavidades'],changes:'Las cavidades mantienen la lección del cruce; un refugio bajo y dos defensores de salida hacen útiles ambos bordes.'},
  {id:7,starts:[at(180,140),at(190,500)],extras:[e(1040,560,'basic'),e(820,300,'basic')],cover:[w(500,390,88,44)],rally:at(780,450),
    lesson:'P1 distrae al centinela; P2 cambia el ángulo y dispara durante su recarga.',roles:['P1 · atraer desde el flanco alto','P2 · atacar desde el flanco bajo'],changes:'Se mantiene un único centinela en su debut. Tres exploradores escoltan sectores diferentes y la madera intermedia ayuda al relevo.'},
  {id:8,starts:[at(175,140),at(175,500)],extras:[e(680,500,'patrol'),e(900,120,'basic')],cover:[w(420,430,66,44)],rally:at(850,270),routeOrder:[1,0],
    lesson:'P1 despeja el anillo; P2 avanza por la escalera. Avísense antes de reunirse.',roles:['P1 · anillo exterior','P2 · escalera de coberturas'],changes:'Las rutas alternadas reciben escolta en cada tramo y un refugio de retirada; la segunda ruta ya no parte del mismo rincón.'},
  {id:9,starts:[at(180,140),at(190,500)],extras:[e(980,370,'patrol'),e(590,350,'basic')],cover:[w(290,310,88,44),w(300,130,44,100),w(300,430,44,110)],rally:at(940,330),
    lesson:'Aíslen una torreta cada uno y mantengan libre el enlace entre sectores.',roles:['P1 · neutralizar el sector norte','P2 · neutralizar el sector sur'],changes:'El enlace lateral gana cobertura; una patrulla interior impide resolver el cruce disparando inmóviles desde ambos extremos.'},
  {id:10,starts:[at(170,140),at(170,500)],extras:[e(1060,330,'patrol'),e(690,350,'basic'),e(1010,460,'patrol')],cover:[w(410,430,88,44)],rally:at(790,350),
    lesson:'Conquisten una mitad cada uno y coordinen el asalto final sin cruzar salvas.',roles:['P1 · conquista norte','P2 · conquista sur'],changes:'El examen añade escolta por sector y cobertura para el relevo. Ocho enemigos definidos sustituyen una duplicación automática.'},
];
