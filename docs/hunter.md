# Cazador: comportamiento y progresión de campaña

En el menú, **Probar cazador** abre una práctica individual o de 2–4 jugadores. Hay un solo cazador y dos coberturas. El equipo confirma sus dispositivos en el lobby habitual. Victoria, derrota, reinicio y salida mantienen la práctica y no registran puntuación, desbloqueos ni victorias de campaña. Las preferencias de audio y controles siguen disponibles.

La campaña introduce al cazador en la misión 21, «El aserradero», y lo incorpora progresivamente en 22–40, con una pausa en 23. Conserva las introducciones de los tres enemigos anteriores durante las primeras veinte misiones. La variante individual y la de pareja presentan un cazador con dos exploradores; tres y cuatro jugadores reciben un cazador, dos exploradores y un patrullero. Sus posiciones, arena y apariciones son explícitas; no se multiplican cazadores ni escoltas al crear `World`.

## Comportamiento

1. Observa durante 0,4 segundos y adquiere un jugador visible. Considera distancia y separación respecto de otros jugadores que también puede ver. Se compromete con el objetivo durante 2,8 segundos; si muere, puede escoger otro.
2. Busca una aproximación lateral entre puestos alrededor del objetivo y esquinas de coberturas. Comprueba posición libre y navegación antes de elegir. El movimiento utiliza las colisiones y cavidades actuales.
3. Detiene las orugas y prepara un tiro durante al menos 0,65 segundos. Un arco cobrizo y un mecanismo ascendente anuncian la preparación. La dirección de disparo se fija al comenzar: moverse permite esquivarlo. El giro de torreta tiene velocidad limitada y puede alargar la preparación.
4. Dispara un misil rápido a 645 unidades por segundo, el doble de un misil normal, con un rebote y queda detenido otros 0,65 segundos. Después vuelve a buscar posición. La recarga dura 2,8 segundos y admite un único misil activo; su inteligencia no acelera con el multiplicador de recarga de la campaña. Calcula los rebotes con el alcance que permite esa velocidad durante la vida del proyectil.

Ve a través de líneas despejadas. Tras perder la visión recuerda la última posición durante dos segundos, sin actualizar las coordenadas del jugador oculto. Puede intentar un rebote hacia esa posición conocida. Cuando pierde la memoria busca terreno mediante un circuito de reconocimiento; no dispara contra alguien que nunca ha visto. Recupera rutas si se atasca durante 0,7 segundos.

Se mueve a 162,75 unidades por segundo, un 40 % más rápido que el jugador actual y un 75 % más rápido que su primera versión (93). El aviso ofensivo y la recuperación conservan sus 0,65 segundos. Muere con un impacto y puede sufrir fuego amigo. Las velocidades, cadencia, físicas y comportamientos de los enemigos anteriores se conservan.

## Evasión y contratiro

Detecta misiles visibles a menos de 500 unidades y predice impactos durante los siguientes 0,9 segundos, incluyendo su propio movimiento. No conoce proyectiles detrás de muros ni anticipa rebotes ocultos: reevalúa una trayectoria cuando el misil realmente rebota. Descarta proyectiles que se alejan o caducan antes de llegar. También reconoce fuego amigo y sus propios misiles tras un rebote.

Tras 0,1 segundos de reacción, elige un desplazamiento perpendicular de 0,34 segundos a su velocidad habitual. Comprueba todo el recorrido contra muros, cavidades, tanques y otros misiles; busca el lado libre de fuego cruzado. Hay 0,45 segundos de descanso entre esquivas. Al terminar evita volver a cruzar el mismo disparo si permanecer en su posición es seguro.

Si ya carga su ataque o no puede esquivar, puede sustituir ese tiro por un **contratiro**: prepara durante al menos 0,2 segundos, gira la torreta con velocidad limitada y calcula dónde interceptar el misil. El arco cambia a azul pálido. Dispara un proyectil real que debe chocar con el entrante mediante las colisiones normales; no borra misiles ni genera un escudo. Si la amenaza desaparece, cancela la preparación. Usa el mismo único misil activo y los mismos 2,8 segundos de recarga que un ataque.

La recuperación de 0,65 segundos después de cualquier disparo y los últimos 0,2 segundos de carga ofensiva son compromisos: no puede cancelarlos para esquivar. Disparos muy cercanos, rebotes tardíos, salvas y ataques desde distintos ángulos aprovechan la reacción, la recarga o la falta de una salida segura. El cazador combina movilidad y defensa limitada; el centinela sigue siendo una defensa estacionaria.

## Apariencia y lectura

Carbón con placas cobrizas, chevrón en el cuerpo y detalles de cobre en la torreta. El arco cobrizo anuncia el ataque y el azul pálido el contratiro; ninguno muestra una trayectoria de tiro. El centinela conserva sus misiles rápidos con propulsión y su interceptación.

## Progresión y variantes

Las campañas individual y de pareja y el debut de la 21 conservan sus datos. Tres y cuatro jugadores tienen diseños explícitos para las 40 misiones. 22 combina un cazador con vigilancia; 23 ofrece un respiro de cazadores para practicar zigzag. 24–29 combinan uno con bisagra, refugios, compuertas, anillo y ventanas. 30 introduce dos cazadores en flancos distintos. 31–40 alternan movilidad y posiciones defensivas; la 36 conserva cinco centinelas y los equipos grandes encuentran un tercer cazador en encuentros seleccionados del último capítulo.

La cantidad máxima del tramo 22–40 es 7/9/10/11 enemigos para 1/2/3/4 jugadores. Se sustituyen escoltas redundantes, sin cambiar la inteligencia, velocidades o recarga ya aprobadas. Las variantes de tres/cuatro cuentan con una zona occidental más profunda, carriles de aparición separados, rutas de apoyo y una formación enemiga explícita. Sus misiones 1–20 limitan los enemigos a ocho/nueve, conservan las introducciones y tienen una galería 16 ampliada que exige rebotes.

Consulta el [registro de progresión](hunter-campaign-review.md) y el [atlas de equipos](https://dabot11.github.io/Wooden-Tanks/party-campaign-review.html), además de los atlas individual y de pareja. El zapador sigue como propuesta y no forma parte de esta integración.

## Verificación

`npm test` comprueba flanqueo real, visibilidad y memoria, compromiso de objetivo, preparación y recuperación completas, dirección fija al esquivar, vulnerabilidad con un misil, perfil del proyectil, navegación de los despliegues y conservación de las introducciones y del debut de la 21. Las pruebas defensivas verifican evasión con disparos reales a 30/60/120 Hz, salidas bloqueadas y fuego cruzado, predicción relativa, intercepción real, límite de munición, cancelación de amenazas y contraataque durante la recuperación. Las pruebas de navegador recorren entrada con 1–4 jugadores, mandos independientes, carga y texturas, un disparo real, pausa, victoria, derrota y repetición sin afectar el progreso. `npm run review:solo`, `npm run review:duo` y `npm run review:party` regeneran sus atlas; `npm run build` verifica TypeScript y producción.
