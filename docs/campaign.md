# Crecer la campaña

Las 40 misiones publicadas son mapas hechos a mano, agrupados en módulos de diez en `src/game/missions`. No se generan niveles adicionales: 100 es una meta editorial, no un límite del código.

Para publicar un capítulo, añade su módulo a `LevelManager.ts`. `registerCampaign` exige IDs consecutivos, enemigos y dificultad positiva que no retroceda. El menú, el desbloqueo, la última misión y la victoria usan la longitud del catálogo; el selector agrupa capítulos y desplaza su contenido para no recortar los controles.

Después de la misión 30, `lateCampaignDifficulty(id)` aumenta 0,05 por misión. La cadencia de los enemigos móviles aumenta suavemente, hasta un máximo de 1,65 respecto de su recarga base; no se acelera indefinidamente. Los centinelas conservan su recarga lenta y sus misiles rápidos, y no cambian las velocidades del jugador ni de los misiles. La presión real también depende del mapa y de la composición: en 31–40 se pasa de cuatro centinelas y cinco patrulleros a cinco y siete. No basta con subir un número: cada capítulo debe introducir rutas, coberturas, flancos y oportunidades de rebote, dejando margen para esquivar.

En cooperativo se conserva la ampliación del mapa y una plantilla completa de enemigos por jugador. Todos los mapas se verifican para uno, dos, tres y cuatro jugadores: puntos de aparición libres, refuerzos suficientes, rutas transitables o rebotes comprobados para zonas restringidas. Evita incrementar indefinidamente la cantidad de enemigos: para capítulos posteriores, alterna desafíos espaciales y composiciones, y prueba el rendimiento con cuatro jugadores.

`completedThrough` guarda la misión más alta completada, aparte de la última desbloqueada. Al ampliar el catálogo se habilita la siguiente misión sin perder récord, preferencias o victorias. Las partidas antiguas de campañas de 10, 20 y 30 misiones tienen una migración de compatibilidad; las ampliaciones nuevas no necesitan añadir otra excepción. Una victoria anterior no salta una misión pendiente cuando existe el nuevo dato de completado.

Ejecuta `npm test`, `npm run build` y las pruebas de navegador al añadir capítulos. Los tests de campaña recorren el catálogo completo; usa su longitud en las pruebas de final de campaña. La prueba con 120 misiones sintéticas comprueba la infraestructura y no publica esos niveles. La dificultad percibida requiere además sesiones reales: las comprobaciones automáticas garantizan geometría y progresión de parámetros, no sustituyen el ajuste después de jugar.
