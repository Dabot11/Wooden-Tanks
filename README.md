# Wooden Tanks

Juego de combate táctico para navegador, construido con **TypeScript, Phaser 3 y Vite**. Treinta misiones de campaña, jugables en solitario o en cooperativo local. Todos los gráficos se generan localmente con Canvas; el audio se sintetiza con Web Audio. No necesita cuentas, claves ni servicios externos.

## Ejecutar

Requiere Node.js **22.12 o superior** (validado con Node 24).

```sh
npm install
npm run dev
```

Abre en tu navegador la dirección que muestra Vite. Para una instalación repetible utiliza `npm ci`.

```sh
npm run build       # Comprobación de TypeScript y compilación a dist/
npm run preview     # Servir la compilación de producción
npm test            # Física, navegación, niveles e inteligencia artificial
```

## Publicar en GitHub Pages

El workflow `.github/workflows/pages.yml` valida y compila el juego al subir cambios a `main`, y despliega `dist/` con las acciones oficiales de GitHub Pages. Los recursos usan rutas relativas para funcionar bajo `/Wooden-Tanks/`.

La primera vez, en GitHub abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**. Después ejecuta **Actions → Publish Wooden Tanks → Run workflow** si la ejecución inicial ocurrió antes de activar Pages. Las siguientes actualizaciones de `main` se publican automáticamente.

La dirección prevista es `https://dabot11.github.io/Wooden-Tanks/`; estará disponible cuando GitHub confirme el despliegue.

## Jugar

| Control | Acción |
| --- | --- |
| WASD / flechas | Movimiento libre |
| Mouse | Apuntar la torreta independientemente del cuerpo |
| Clic izquierdo / espacio | Disparar; mantener pulsado para repetir |
| Esc | Pausar / reanudar |
| M | Activar / silenciar audio |

Al apuntar con mouse, la mira se centra exactamente en el cursor y se oculta al usar el mando, pausar o perder el tanque. Los misiles que chocan se destruyen con un destello, una onda expansiva y humo, sin daño de área.

Cada tanque se destruye con un impacto. Tienes tres vidas, cinco proyectiles simultáneos y una recarga de 280 ms. Las balas rebotan hasta dos veces; el siguiente impacto sólido las elimina. Caducan a los siete segundos. **Tu propio proyectil también puede destruirte al regresar.** Los huecos circulares son cavidades del suelo: bloquean a los tanques, la IA los rodea y los proyectiles pasan por encima. Los bloques de corcho se rompen tras tres impactos; los bloques de madera son indestructibles.

Destruye todos los enemigos para pasar de misión. Completarla desbloquea la siguiente y otorga una bonificación de tiempo. Al morir se reinicia el tablero y la puntuación vuelve a la que tenías al entrar en esa misión. Reiniciar desde la pausa también restaura esa puntuación, sin consumir una vida. El récord, las misiones desbloqueadas, las campañas ganadas y la preferencia de sonido se guardan en LocalStorage. Si el almacenamiento no está disponible, la partida funciona igualmente durante la sesión.

El inicio ofrece **Un jugador**, **Cooperativo local**, **Misiones** y **Ajustes del control**. Navega con mouse, Tab o flechas y Enter; Esc regresa de los diálogos. Con mando, usa stick/cruceta y A/B.

## Control Xbox y otros gamepads estándar

En Chrome para macOS puedes usar un **Xbox Series Controller** por Bluetooth o USB-C. Empareja el mando en **Ajustes del Sistema → Bluetooth**, o conéctalo con un cable USB-C que transmita datos. Abre el juego por HTTPS (o en el servidor local), mantén la pestaña activa y pulsa un botón del mando: algunos navegadores no lo muestran hasta la primera interacción. Suelta los sticks y botones antes de comenzar.

| Control físico | Acción |
| --- | --- |
| Stick izquierdo | Movimiento en 360 grados |
| Stick derecho | Apuntado independiente en 360 grados |
| RT | Disparar; permite mantenerlo presionado |
| Botón Menú | Pausar / reanudar |
| A | Confirmar la opción seleccionada |
| B | Cancelar / regresar; en pausa, reanudar |
| Stick izquierdo / cruceta | Navegar por opciones de menú |

La torreta conserva su última dirección al soltar el stick derecho. El tanque mantiene la velocidad del juego original: la inclinación selecciona la dirección, sin cambiar las físicas. Puedes alternar con teclado y mouse sin reiniciar; una nueva acción deliberada selecciona el dispositivo. Un stick inmóvil que ya estaba inclinado no recupera el control sobre el teclado automáticamente.

**Ajustes del control**, en el menú principal o en la pausa, permite configurar zonas muertas radiales independientes: 18 % para movimiento y 20 % para apuntado inicialmente, ajustables entre 5 % y 45 %. Usa el mouse/teclado o la cruceta / stick: arriba y abajo eligen el ajuste, izquierda y derecha lo cambian. Se guardan en `wooden-tanks-gamepad-v1` de LocalStorage y hay un botón para restaurar los valores. Aumenta la zona si hay drift.

El aviso de conexión y las pistas de controles se actualizan automáticamente. Si el control activo se desconecta, la partida se pausa y puede continuarse con teclado/mouse. Conectar un mando con botones pulsados no inicia ni dispara; después de conectar, cambiar de pantalla, reanudar o volver a la pestaña, suelta **ambos sticks, RT y los botones** para habilitarlo. A/B/Menú y la navegación se activan una vez por pulsación; RT conserva la recarga y el límite de proyectiles existentes.

Se utiliza la **Gamepad API** y el mapeo `standard` del navegador (A=0, B=1, RT=7, Menú=9, sticks=0–3). Otros gamepads twin-stick con ese mapeo también funcionan. Un mando sin mapeo estándar muestra un aviso y deja disponibles teclado y mouse; no se adivina su distribución. Si el navegador no ofrece la API o la bloquea, el juego sigue funcionando con los controles originales.

Si Chrome bloquea el audio al empezar exclusivamente con el mando, haz un clic en el juego para autorizarlo. Las pruebas automatizadas simulan un Xbox a través de `navigator.getGamepads()`; no sustituyen una prueba física en Mac con Bluetooth/USB.

## Cooperativo local

Elige **Cooperativo local**, selecciona 2, 3 o 4 jugadores y pulsa un botón en cada mando conectado por Bluetooth o USB para que Chrome lo detecte.

- **Controles para todos:** el mando usado en el menú se asigna primero. LS mueve, RS apunta y RT dispara.
- **Teclado + controles:** P1 usa WASD, mouse y clic/espacio; los restantes usan un mando cada uno.
- P1 azul, P2 rojo, P3 verde y P4 amarillo. Cada jugador tiene recarga propia y cinco proyectiles; la puntuación y las tres vidas son compartidas.
- **Fuego amigo activo:** cualquier proyectil puede matar a un compañero. Las colisiones entre misiles destruyen ambos y producen una explosión visual.
- Los caídos esperan la siguiente misión. Si cae todo el equipo, se consume una vida y se reinicia la misión.
- MENÚ en cualquier mando o ESC pausa para todos. A confirma y B regresa. Una desconexión pausa y conserva el puesto: ningún otro mando sustituye automáticamente al ausente. Suelta sticks y gatillos al reanudar. Si Chrome cambia el índice del dispositivo, vuelve al menú para reasignarlo.
- Cada jugador adicional amplía ambos ejes del mapa un 20 % y añade una dotación completa de enemigos: cuatro jugadores tienen 1,6 veces el ancho/alto y cuatro veces los enemigos. La cámara muestra todo el terreno; el mouse se transforma a coordenadas del mundo y la mira permanece exactamente en el cursor.

La campaña contiene treinta misiones con cobertura, corcho destructible, cavidades y rutas que exigen esquivas y rebotes. En la misión 16, Galería de rebotes, las cavidades encierran a los jugadores en una zona: la pared bloquea el tiro directo y los centinelas deben alcanzarse rebotando por abajo. El progreso, récord y preferencias existentes se conservan. Las pruebas simulan Xbox con nombres iguales e índices independientes; Bluetooth/USB físicos en macOS requieren comprobación en la laptop.

## Sala de jugadores y duelo

Cooperativo y Duelo comparten una sala para 2, 3 o 4 jugadores. Primero elige cantidad y esquema de entrada. Cada puesto muestra su número, color y dispositivo: Xbox, Nintendo, PlayStation, control genérico o teclado/mouse. Los mandos se identifican por el nombre que comunica el navegador y requieren mapeo estándar de Gamepad API.

Cada mando confirma con el botón inferior: A en Xbox, B en Nintendo o ✕ en PlayStation. P1 con teclado/mouse confirma con Enter. La partida comienza cuando todos estén listos; vuelve a pulsar para retirar la confirmación. Si faltan dispositivos aparece la cantidad pendiente. Una desconexión conserva el puesto y exige confirmar de nuevo al reconectar.

Duelo es todos contra todos, sin enemigos de IA. El último tanque vivo gana la ronda; tres victorias ganan la partida. Si todos caen en el mismo intercambio se repite la ronda sin puntos. Tres arenas alternan cobertura y corcho, con apariciones separadas. La revancha conserva los dispositivos y reinicia los resultados; no modifica el récord ni los desbloqueos de campaña.

**P**, Esc o Menú pausan y reanudan tanto campaña como duelo. Mantener la tecla no alterna repetidamente la pausa.

## Enemigos

Solo estos tres tipos aparecen en las treinta misiones:

- **Explorador gris (misión 1):** móvil y lento, un misil activo, sin rebotes.
- **Patrullero violeta con franjas oscuras (misión 3):** móvil, puede esquivar, hasta dos misiles activos y un rebote por misil.
- **Centinela marfil con negro/naranja (misión 7):** inmóvil; misil propulsado 80 % más rápido, un rebote y recarga de 3,4 segundos. Detecta amenazas próximas con línea de visión y dispara para interceptarlas. Ataque y defensa consumen la misma recarga; su giro limitado permite vencerlo con salvas o rebotes tardíos.

Los jugadores conservan dos rebotes y la velocidad de movimiento previamente reducida. Los proyectiles registran su perfil al dispararse, incluso si su propietario muere. El centinela destruye amenazas mediante colisiones reales entre misiles, sin escudo invisible.

## Pruebas de navegador

```sh
npx playwright install chromium
npm run test:e2e
```

Para reutilizar Chromium instalado en el sistema:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright arranca Vite automáticamente si no está activo. Comprueba una victoria con controles reales, movimiento y apuntado, disparos, pausa, reinicio, pérdida de vidas, Game Over, las treinta transiciones de campaña, victoria final, persistencia y proporción 16:9. También comprueba twin-stick, RT, retención de apuntado, conexión/desconexión, alternancia de dispositivos, menús con A/B y zonas muertas guardadas. Las pruebas de pérdida de vidas y de transiciones usan proyectiles de prueba para producir colisiones controladas. El acceso de diagnóstico `window.__wooden` solo existe en modo desarrollo; no forma parte de la compilación de producción.

## Arquitectura

- `src/game/World.ts`: simulación independiente de Phaser; tanques, combate y eventos.
- `CollisionManager.ts`: barrido continuo contra cajas y círculos, reflexión por normal y comprobación de línea de visión.
- `EnemyAI.ts`: estados de IA, navegación y cálculo de rebotes.
- `LevelManager.ts`: datos de campaña.
- `Tank.ts` / `types.ts`: entidades y parámetros del combate.
- `TextureFactory.ts` / `BoardRenderer.ts`: texturas procedurales, tablero, sombras, orugas, tanques y proyectiles.
- `ParticleEffects.ts` / `AudioManager.ts`: impactos, explosiones, humo y sonido.
- `Progress.ts`: persistencia con validación y recuperación ante datos corruptos.
- `src/scenes/`: menú y ciclo de partida.
- `src/ui/`: HUD, ajustes del control y diálogos HTML, escalados con el tablero.
- `src/input/`: normalización y estado puro del gamepad, adaptación de la Gamepad API y navegación de menús.

La integración de gamepad se limita a la entrada; los huecos forman parte de los datos del tablero y de la colisión y navegación de los tanques.

La simulación limita el delta a 50 ms y usa colisión barrida para que las balas no atraviesen paredes. Un impacto consume el tiempo restante del fotograma después de reflejar la velocidad; una separación mínima evita rebotes repetidos sobre la misma cara. Los efectos y las marcas de orugas tienen límites para mantener estable la carga.

El juego está diseñado para computadora con teclado/mouse o gamepad estándar. El tablero conserva 16:9 y añade márgenes cuando la ventana tiene otra proporción. No incluye controles táctiles.

## Preparación y audio

La campaña tiene 30 misiones. Las partidas que terminaron el capítulo de veinte misiones desbloquean la misión 21 y conservan el récord y el sonido. Antes de cada misión y cada reintento aparece su nombre, objetivo y cantidad real de exploradores, patrulleros y centinelas, incluidos los refuerzos del cooperativo. La simulación espera a **Continuar** (clic, Enter o A del mando). Los duelos conservan su introducción de ronda.

Una marcha original de 112 BPM combina melodía de juguete, bajo y percusión. Los efectos se sintetizan con Web Audio: disparos con chasquido y golpe grave, resonancias cortas de madera para rebotes, crujidos para destrucciones y orugas sincronizadas con el desplazamiento real. El volumen de la música deja espacio a los efectos; un compresor y límites de voces controlan las salvas grandes.

El sonido se activa tras una interacción del navegador. **M** o el botón de sonido silencian música y efectos y guardan la preferencia. La pausa y el cambio de pestaña detienen el audio; al reanudar vuelve la música. No se descargan archivos musicales ni se requiere un servicio externo.
