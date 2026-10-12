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

Cada tanque se destruye con un impacto. Tienes tres vidas, cinco proyectiles simultáneos y una recarga de 280 ms. Las balas rebotan hasta dos veces; el siguiente impacto sólido las elimina. Caducan a los siete segundos. **Tu propio proyectil también puede destruirte al regresar.** Los bloques de corcho se rompen tras tres impactos; los bloques de madera son indestructibles.

Destruye todos los enemigos para pasar de misión. Completarla desbloquea la siguiente y otorga una bonificación de tiempo. Al morir se reinicia el tablero y la puntuación vuelve a la que tenías al entrar en esa misión. Reiniciar desde la pausa también restaura esa puntuación, sin consumir una vida. El récord, las misiones desbloqueadas, las campañas ganadas y la preferencia de sonido se guardan en LocalStorage. Si el almacenamiento no está disponible, la partida funciona igualmente durante la sesión.

El menú permite abrir directamente **El tablero de referencia**, la misión 65, con el jugador azul abajo a la izquierda, un enemigo oscuro en el centro y dos morados arriba a la derecha. Ganar esa demostración no desbloquea misiones de campaña.

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

Playwright arranca Vite automáticamente si no está activo. Comprueba una victoria con controles reales, movimiento y apuntado, disparos, pausa, reinicio, pérdida de vidas, Game Over, las diez transiciones de campaña, victoria final, persistencia y proporción 16:9. Las pruebas de pérdida de vidas y de transiciones usan proyectiles de prueba para producir colisiones controladas. El acceso de diagnóstico `window.__wooden` solo existe en modo desarrollo; no forma parte de la compilación de producción.

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
- `src/ui/`: HUD y diálogos HTML, escalados con el tablero.

La simulación limita el delta a 50 ms y usa colisión barrida para que las balas no atraviesen paredes. Un impacto consume el tiempo restante del fotograma después de reflejar la velocidad; una separación mínima evita rebotes repetidos sobre la misma cara. Los efectos y las marcas de orugas tienen límites para mantener estable la carga.

El juego está diseñado para computadora con teclado y mouse. El tablero conserva 16:9 y añade márgenes cuando la ventana tiene otra proporción. No incluye controles táctiles.
