# ZOMBIS — Última Señal

Juego de acción y supervivencia **3D** para un jugador, en español. Explora una zona de exclusión, saquea suministros, mejora tu arsenal y defiende el Refugio 07 hasta la evacuación.

El mundo utiliza Three.js y WebGL 2: modelos tridimensionales, cámara en perspectiva, personajes articulados, sombras, niebla, paneles solares, barricadas, vehículos abandonados, partículas y linterna nocturna. Puedes girar y acercar la cámara; el movimiento se adapta a su orientación. El apuntado proyecta el cursor sobre el escenario 3D. Los edificios que ocultan al superviviente se vuelven translúcidos.

## Jugar

1. Elige **Explorador**, **Superviviente** o **Sin piedad** e inicia una expedición.
2. Busca cajas de suministros. Mantén **E** cerca de una caja para saquearla.
3. Recupera los **tres relés azules** en la estación, la clínica y el depósito. El mapa y las flechas del campo indican sus ubicaciones.
4. Regresa al refugio y abre el taller con **Tab** para fabricar munición, botiquines, mejoras de daño, armas, blindaje y torretas.
5. Resiste **cinco noches** manteniendo vivos al superviviente y al refugio. Cada amanecer concede suministros y recupera parte de la salud e integridad.
6. Si termina la quinta noche y aún faltan relés, recupéralos y vuelve al refugio para evacuar.

Una expedición dura aproximadamente 12 minutos. Puedes adelantar el anochecer desde el taller. Correr y disparar generan ruido: los enemigos te detectan desde más lejos y aparecen con mayor frecuencia durante la noche. Hay caminantes, corredores y brutos; las noches 3 y 5 incluyen un bruto adicional.

### Controles

| Acción | Escritorio |
| --- | --- |
| Moverse | WASD o flechas |
| Apuntar / disparar | Ratón / clic izquierdo mantenido |
| Correr | Shift, consume resistencia |
| Saquear / recuperar relé | Mantener E |
| Recargar | R o botón junto al cargador |
| Curarse | Q |
| Cambiar de arma | 1, 2, 3 o nombre del arma |
| Taller | Tab, cerca del refugio |
| Mapa | M |
| Pausa | Escape |
| Girar cámara | Z / X o botones ↶ / ↷ |
| Acercar / alejar | Rueda del ratón o botones + / − |
| Restablecer cámara | V o botón ⌖ |
| Pantalla completa | Botón ⛶, si el navegador lo permite |

En pantallas táctiles se muestran un joystick, disparo con apuntado automático, interacción y curación. Arrastra el joystick más allá del círculo para correr. Toca el nombre del arma para cambiar entre las desbloqueadas y el botón R para recargar. El mapa y el taller también se abren con sus botones. La barra 3D permite girar y acercar la vista sin teclado. En dispositivos táctiles se limita la resolución de renderizado y se desactivan las sombras dinámicas para reducir la carga gráfica.

El mapa, los menús y la pérdida de foco pausan la simulación. El récord, las expediciones completadas, las victorias y la preferencia de sonido se guardan en `localStorage`. La partida en curso vive en memoria: recargar la página la reinicia.

## Desarrollo

Requisitos de desarrollo: Node.js 22.12+ o 24 y npm. El entorno preparado utiliza Node.js 24.19.0. Para jugar se necesita un navegador con **WebGL 2** y aceleración gráfica habilitada. Si el navegador no dispone de WebGL, la interfaz explica cómo habilitarlo. No requiere backend, base de datos, cuentas ni claves de API.

```sh
cd /workspace/GAMEZOMBIS
npm ci --cache /tmp/zombis-npm-cache
npm run dev -- --port 5173 --strictPort
```

Vite escucha en el puerto 5173 y en todas las interfaces. Para preparar la distribución estática:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

`dist/` contiene los archivos publicables en un servidor estático. Usa HTTP(S) para servirlos. El mundo se renderiza con Three.js/WebGL 2; el radar utiliza Canvas 2D y el audio se sintetiza con Web Audio. Three.js y las tipografías se sirven desde el propio proyecto. Tras cargar sus recursos, la partida no hace peticiones externas. Esto no instala un service worker ni garantiza recarga sin conexión.

Para publicar bajo un subdirectorio, genera con `npm run build -- --base=/nombre-del-subdirectorio/`. Los recursos y el favicon respetan esa ruta. La configuración por defecto está preparada para la raíz de un dominio.

## Compartir con GitHub Pages

La dirección prevista del juego es **https://baztp.github.io/GAMEZOMBIS/**. Estará disponible cuando GitHub Pages termine de publicar la rama `gh-pages`.

```sh
npm run deploy:pages
```

Este comando compila para `/GAMEZOMBIS/` y sube únicamente los archivos estáticos a `gh-pages`, incluyendo `.nojekyll`. Requiere acceso de escritura al repositorio. Conserva la rama de trabajo y el índice de Git; no usa un worktree ni fuerza el historial remoto.

Si Pages no está activado, abre **Settings → Pages** en GitHub y selecciona **Deploy from a branch → gh-pages → / (root) → Save**. Espera a que GitHub confirme el despliegue antes de compartir la dirección. Publicar el código en `main` no actualiza por sí solo el juego: ejecuta `npm run deploy:pages` después de las futuras actualizaciones.

## Verificación

```sh
npm test
npm run test:e2e
npm run build
```

- **12 pruebas de motor** con `node:test`: generación, movimiento, colisiones, disparos, recarga, saqueo, fabricación, curación, ciclo día/noche, torretas, victoria y derrota.
- **7 pruebas de navegador** con Playwright: flujo de escritorio, controles táctiles, sonido sin peticiones externas, renderizado WebGL real, disparos tras girar la cámara, liberación de recursos gráficos al reiniciar, iluminación nocturna, controles de cámara y respuesta ante la ausencia de WebGL.
- Las pruebas de navegador usan Chromium en `/usr/bin/chromium`. Si está en otra ruta, establece `CHROMIUM_PATH`. Playwright inicia Vite automáticamente si no está funcionando.
- Las capturas de comprobación se guardan en `/tmp/zombis-desktop.png`, `/tmp/zombis-playing.png` y `/tmp/zombis-mobile.png`.

En otra máquina, instala Chromium mediante el gestor de paquetes del sistema y configura `CHROMIUM_PATH`. Para utilizar el navegador administrado por Playwright, instala sus navegadores y ajusta `launchOptions.executablePath` en `playwright.config.js`.

## Organización

- `src/engine.js`: estado del mundo, IA, combate, economía y reglas de la partida. Independiente del DOM.
- `src/render.js`: escena Three.js, cámara, proyección del cursor, luces, sombras, efectos y ciclo de vida de los recursos gráficos.
- `src/models.js`: modelos tridimensionales procedurales y agrupación de geometría estática para reducir llamadas de dibujo.
- `src/minimap.js`: radar táctico y mapa del sector con Canvas 2D.
- `src/main.js`: interfaz, teclado, puntero, controles táctiles, menús y récord local.
- `src/audio.js`: efectos de sonido sintetizados, sin archivos de audio externos.
- `src/style.css`: interfaz adaptable, estilos de los menús y controles.
- `tests/`: pruebas del motor y del navegador.

Cada tarea de nube ya está aislada. Trabaja en el checkout existente; no crees un worktree salvo que se solicite explícitamente. Los procesos de Vite deben volver a iniciarse en una nueva sesión aunque las dependencias estén conservadas.

Las fuentes distribuidas mediante `@fontsource` conservan sus licencias en sus respectivos paquetes. Los gráficos y efectos son procedurales. Esta entrega es un juego local para un jugador; no incluye multijugador ni sincronización de partidas entre dispositivos.
