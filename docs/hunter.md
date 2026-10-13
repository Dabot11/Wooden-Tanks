# Cazador: prototipo y debut en la misión 21

En el menú, **Probar cazador** abre una práctica individual o de 2–4 jugadores. Hay un solo cazador y dos coberturas. El equipo confirma sus dispositivos en el lobby habitual. Victoria, derrota, reinicio y salida mantienen la práctica y no registran puntuación, desbloqueos ni victorias de campaña. Las preferencias de audio y controles siguen disponibles.

La campaña incorpora al cazador únicamente en la misión 21, «Líneas de corte». Conserva las introducciones de los tres enemigos anteriores durante las primeras veinte misiones. La variante individual y la de pareja presentan un cazador con dos exploradores; tres y cuatro jugadores reciben un cazador, dos exploradores y un patrullero. Sus posiciones, arena y apariciones son explícitas; no se multiplican cazadores ni escoltas al crear `World`.

## Comportamiento

1. Observa durante 0,4 segundos y adquiere un jugador visible. Considera distancia y separación respecto de otros jugadores que también puede ver. Se compromete con el objetivo durante 2,8 segundos; si muere, puede escoger otro.
2. Busca una aproximación lateral entre puestos alrededor del objetivo y esquinas de coberturas. Comprueba posición libre y navegación antes de elegir. El movimiento utiliza las colisiones y cavidades actuales.
3. Detiene las orugas y prepara un tiro durante al menos 0,65 segundos. Un arco cobrizo y un mecanismo ascendente anuncian la preparación. La dirección de disparo se fija al comenzar: moverse permite esquivarlo. El giro de torreta tiene velocidad limitada y puede alargar la preparación.
4. Dispara un misil normal con un rebote y queda detenido otros 0,65 segundos. Después vuelve a buscar posición. La recarga dura 2,8 segundos y admite un único misil activo; su inteligencia no acelera con el multiplicador de recarga de la campaña.

Ve a través de líneas despejadas. Tras perder la visión recuerda la última posición durante dos segundos, sin actualizar las coordenadas del jugador oculto. Puede intentar un rebote hacia esa posición conocida. Cuando pierde la memoria busca terreno mediante un circuito de reconocimiento; no dispara contra alguien que nunca ha visto. Recupera rutas si se atasca durante 0,7 segundos.

Se mueve a 93 unidades por segundo, el 80 % de la velocidad del jugador actual. Muere con un impacto, puede sufrir fuego amigo y no intercepta proyectiles. Las velocidades, cadencia, físicas y comportamientos de los enemigos anteriores se conservan.

## Apariencia y lectura

Carbón con placas cobrizas, chevrón en el cuerpo y detalles de cobre en la torreta. El arco de carga muestra su preparación, no una trayectoria de tiro. El centinela conserva sus misiles rápidos con propulsión y su interceptación.

## Alcance y ajuste siguiente

Los mapas 1–20 y 22–40 conservan sus datos anteriores. La revisión completa de tres y cuatro jugadores sigue pendiente; solo su misión 21 tiene este debut diseñado. Los atlas individual y de pareja incluyen la nueva formación y una leyenda de cazadores.

Primero jugar la práctica y la 21: comprobar que se reconoce el rodeo, que la carga se lee con música y varios jugadores, y que el contraataque resulta satisfactorio. Después de ese ajuste, decidir dónde incorporar cazadores y reducir escoltas en 22–40. El zapador sigue como propuesta; no forma parte de este prototipo.

## Verificación

`npm test` comprueba flanqueo real, visibilidad y memoria, compromiso de objetivo, preparación y recuperación completas, dirección fija al esquivar, vulnerabilidad con un misil, perfil del proyectil, navegación de los despliegues y conservación de los mapas ajenos a la 21. Las pruebas de navegador recorren entrada con 1–4 jugadores, mandos independientes, carga y texturas, un disparo real, pausa, victoria, derrota y repetición sin afectar el progreso. `npm run review:solo` y `npm run review:duo` regeneran sus atlas; `npm run build` verifica TypeScript y producción.
