# Cazador: comportamiento y progresión de campaña

En el menú, **Probar cazador** abre una práctica individual o de 2–4 jugadores. Hay un solo cazador y dos coberturas. El equipo confirma sus dispositivos en el lobby habitual. Victoria, derrota, reinicio y salida mantienen la práctica y no registran puntuación, desbloqueos ni victorias de campaña. Las preferencias de audio y controles siguen disponibles.

El cazador debuta en la misión 31, «Primer cazador», con exactamente uno para todo el equipo. 31–32 permiten aprender su contratiro; 33–35 combinan dos en flancos distintos y desde 36 aparecen tres. Sus posiciones, la arena y las salidas se revisan para cada cantidad de jugadores, sin multiplicar cazadores al crear World.

## Comportamiento

1. Observa durante 0,4 segundos y adquiere un jugador visible. Considera distancia y separación respecto de otros jugadores que también puede ver. Se compromete con el objetivo durante 2,8 segundos; si muere, puede escoger otro.
2. Busca una aproximación lateral entre puestos alrededor del objetivo y esquinas de coberturas. Comprueba posición libre y navegación antes de elegir. El movimiento utiliza las colisiones y cavidades actuales.
3. Detiene las orugas y prepara un tiro durante al menos 0,65 segundos. Un arco cobrizo y un mecanismo ascendente anuncian la preparación. La dirección de disparo se fija al comenzar: moverse permite esquivarlo. El giro de torreta tiene velocidad limitada y puede alargar la preparación.
4. Dispara un misil rápido a 645 unidades por segundo, el doble de un misil normal, con un rebote y queda detenido otros 0,65 segundos. Después vuelve a buscar posición. La recarga dura 2,8 segundos y admite un único misil activo; su inteligencia no acelera con el multiplicador de recarga de la campaña. Calcula los rebotes con el alcance que permite esa velocidad durante la vida del proyectil.

Ve a través de líneas despejadas. Tras perder la visión recuerda la última posición durante dos segundos, sin actualizar las coordenadas del jugador oculto. Puede intentar un rebote hacia esa posición conocida. Cuando pierde la memoria busca terreno mediante un circuito de reconocimiento; no dispara contra alguien que nunca ha visto. Recupera rutas si se atasca durante 0,7 segundos.

Se mueve a 162,75 unidades por segundo, un 40 % más rápido que el jugador actual y un 75 % más rápido que su primera versión (93). El aviso ofensivo y la recuperación conservan sus 0,65 segundos. Muere con un impacto y puede sufrir fuego amigo. Las velocidades, cadencia, físicas y comportamientos de los enemigos anteriores se conservan.

## Evasión y contratiro

Detecta misiles visibles a menos de 500 unidades y predice impactos durante los siguientes 0,9 segundos, incluyendo su propio movimiento. No conoce proyectiles detrás de muros ni anticipa rebotes ocultos: reevalúa una trayectoria cuando el misil realmente rebota. Descarta proyectiles que se alejan o ya están destruidos; la antigüedad de un misil activo no reduce su amenaza. También reconoce fuego amigo y sus propios misiles tras un rebote.

Tras 0,1 segundos de reacción, elige un desplazamiento perpendicular de 0,34 segundos a su velocidad habitual. Comprueba todo el recorrido contra muros, cavidades, tanques y otros misiles; busca el lado libre de fuego cruzado. Hay 0,45 segundos de descanso entre esquivas. Al terminar evita volver a cruzar el mismo disparo si permanecer en su posición es seguro.

Si ya carga su ataque o no puede esquivar, puede sustituir ese tiro por un **contratiro**: prepara durante al menos 0,2 segundos, gira la torreta con velocidad limitada y calcula dónde interceptar el misil. El arco cambia a azul pálido. Dispara un proyectil real que debe chocar con el entrante mediante las colisiones normales; no borra misiles ni genera un escudo. Si la amenaza desaparece, cancela la preparación. Usa el mismo único misil activo y los mismos 2,8 segundos de recarga que un ataque.

La recuperación de 0,65 segundos después de cualquier disparo y los últimos 0,2 segundos de carga ofensiva son compromisos: no puede cancelarlos para esquivar. Disparos muy cercanos, rebotes tardíos, salvas y ataques desde distintos ángulos aprovechan la reacción, la recarga o la falta de una salida segura. El cazador combina movilidad y defensa limitada; el centinela sigue siendo una defensa estacionaria.

## Apariencia y lectura

Carbón con placas cobrizas, chevrón en el cuerpo y detalles de cobre en la torreta. El arco cobrizo anuncia el ataque y el azul pálido el contratiro; ninguno muestra una trayectoria de tiro. El centinela conserva sus misiles rápidos con propulsión y su interceptación.

## Progresión y variantes

La campaña tiene cuatro capítulos: grises en 1–10, patrulleros desde 11, centinelas desde 21 y cazadores desde 31. La galería de rebotes pasa a la 26 y los cinco vigías a la 30. Se revisan las 160 variantes, con una decisión táctica y formación propia por misión y tamaño de equipo.

Los límites globales son 7/9/10/11 enemigos para 1/2/3/4 jugadores. La dificultad del cazador aprobado se conserva; cambia el papel de cada escolta, la combinación de defensas y las conexiones del mapa. La práctica utiliza la arena de la 31 y un solo cazador, preservando el guardado.

Consulta el [registro de progresión](hunter-campaign-review.md) y el [atlas de equipos](https://dabot11.github.io/Wooden-Tanks/party-campaign-review.html), además de los atlas individual y de pareja. El zapador sigue como propuesta y no forma parte de esta integración.

## Verificación

`npm test` comprueba flanqueo real, visibilidad y memoria, compromiso de objetivo, preparación y recuperación completas, dirección fija al esquivar, vulnerabilidad con un misil, perfil del proyectil, navegación de los despliegues y conservación de las introducciones y del debut de la 31. Las pruebas defensivas verifican evasión con disparos reales a 30/60/120 Hz, salidas bloqueadas y fuego cruzado, predicción relativa, intercepción real, límite de munición, cancelación de amenazas y contraataque durante la recuperación. Las pruebas de navegador recorren entrada con 1–4 jugadores, mandos independientes, carga y texturas, un disparo real, pausa, victoria, derrota y repetición sin afectar el progreso. `npm run review:solo`, `npm run review:duo` y `npm run review:party` regeneran sus atlas; `npm run build` verifica TypeScript y producción.
