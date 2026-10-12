# Wooden Tanks

Juego de combate táctico para navegador, construido con **TypeScript, Phaser 3 y Vite**. Once tableros jugables: diez misiones de campaña y una demostración inspirada en la referencia de Wii Play. Todos los gráficos se generan localmente con Canvas; el audio se sintetiza con Web Audio. No necesita cuentas, claves ni servicios externos.

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

Cada tanque se destruye con un impacto. Tienes tres vidas, cinco proyectiles simultáneos y una recarga de 280 ms. Las balas rebotan hasta dos veces; el siguiente impacto sólido las elimina. Caducan a los siete segundos. **Tu propio proyectil también puede destruirte al regresar.** Los huecos circulares son cavidades del suelo: bloquean a los tanques, la IA los rodea y los proyectiles pasan por encima. Los bloques de corcho se rompen tras tres impactos; los bloques de madera son indestructibles.

Destruye todos los enemigos para pasar de misión. Completarla desbloquea la siguiente y otorga una bonificación de tiempo. Al morir se reinicia el tablero y la puntuación vuelve a la que tenías al entrar en esa misión. Reiniciar desde la pausa también restaura esa puntuación, sin consumir una vida. El récord, las misiones desbloqueadas, las campañas ganadas y la preferencia de sonido se guardan en LocalStorage. Si el almacenamiento no está disponible, la partida funciona igualmente durante la sesión.

El menú permite abrir directamente **El tablero de referencia**, la misión 65, con el jugador azul abajo a la izquierda, un enemigo oscuro en el centro y dos morados arriba a la derecha. Ganar esa demostración no desbloquea misiones de campaña.

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

En el menú, elige **Cooperativo · 2 jugadores** y conecta los mandos por Bluetooth o USB. Chrome puede necesitar una pulsación en cada mando para mostrarlo.

- **Dos controles:** el usado en el menú se asigna a P1 (azul); el otro, a P2 (dorado). Cada uno usa LS para mover, RS para apuntar y RT para disparar.
- **Teclado + control:** P1 conserva WASD, mouse y clic/espacio; el mando controla exclusivamente a P2.
- Cada jugador tiene su propia recarga y cinco proyectiles. Ambos comparten puntuación y tres vidas.
- No hay daño entre compañeros. Los propios disparos rebotados siguen siendo peligrosos y los misiles siguen destruyéndose al chocar entre sí.
- Si cae un jugador, el otro puede terminar la misión. Ambos reaparecen al avanzar; si caen los dos, se pierde una vida compartida y se reinicia la misión.
- MENÚ en cualquiera de los mandos o ESC pausa para ambos. A confirma y B regresa; una pulsación simultánea no activa dos opciones.
- Una desconexión pausa la partida y conserva la asignación. Reconecta el mismo mando antes de reanudar; suelta sticks y gatillos para volver a jugar. Un tercer mando no sustituye automáticamente al ausente. Si Chrome le asigna otro índice al reconectarlo, vuelve al menú y asigna los controles de nuevo.

El modo de un jugador sigue disponible en **Jugar campaña**. Las pruebas simulan dos Xbox con el mismo nombre e índices independientes; la conexión física Bluetooth/USB en macOS debe comprobarse en la laptop.

## Enemigos

- **Gris · básico:** lento, defensivo; dispara con línea de visión y busca otro ángulo cuando pierde al jugador.
- **Morado · patrullero:** recorre puntos del tablero, busca rutas libres y puede esquivar.
- **Rojo · ofensivo:** persigue al jugador, acorta la distancia y dispara más rápido.
- **Verde · táctico:** mantiene distancia, busca cobertura durante la recarga, se reposiciona, esquiva proyectiles y calcula ataques de un rebote mediante objetivos reflejados.

Los enemigos tienen tiempos de reacción, rotación gradual de torreta y un pequeño error al apuntar. La navegación usa una cuadrícula de paso seguro, pero las posiciones, el movimiento y las colisiones son continuos.

## Pruebas de navegador

```sh
npx playwright install chromium
npm run test:e2e
```

Para reutilizar Chromium instalado en el sistema:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright arranca Vite automáticamente si no está activo. Comprueba una victoria con controles reales, movimiento y apuntado, disparos, pausa, reinicio, pérdida de vidas, Game Over, las diez transiciones de campaña, victoria final, persistencia y proporción 16:9. También comprueba twin-stick, RT, retención de apuntado, conexión/desconexión, alternancia de dispositivos, menús con A/B y zonas muertas guardadas. Las pruebas de pérdida de vidas y de transiciones usan proyectiles de prueba para producir colisiones controladas. El acceso de diagnóstico `window.__wooden` solo existe en modo desarrollo; no forma parte de la compilación de producción.

## Arquitectura

- `src/game/World.ts`: simulación independiente de Phaser; tanques, combate y eventos.
- `CollisionManager.ts`: barrido continuo contra cajas y círculos, reflexión por normal y comprobación de línea de visión.
- `EnemyAI.ts`: estados de IA, navegación y cálculo de rebotes.
- `LevelManager.ts`: datos de campaña y demostración.
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
