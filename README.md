# GP FIGHTERS — prueba web 01

Adaptación independiente del juego de Windows. Preparada para Safari en iPhone 13, en horizontal, y navegadores de escritorio modernos.

## Incluye
- Juan, Rodri, Diego y Gabi; selección de personaje y rival CPU.
- Blanes Viale, sprites y sonidos del proyecto original comprimidos para web.
- Golpes, patadas, salto, patada aérea, barrida, defensa alta/baja, energía y poderes.
- Mejor de tres rounds, pausa, revancha y cambio de personaje.
- Controles multitáctiles; pausa al salir de la pestaña y detención al girar a vertical.

Es una prueba de jugabilidad móvil: todavía no incluye los 13 personajes, torneo, LAN, entradas completas ni todos los efectos de la versión de Windows. Los especiales tienen una representación simplificada; el especial provisional de Rodri es una descarga de barra, no el ayudante de la versión de escritorio. No se probó todavía en un iPhone físico.

## Ejecutar localmente
Desde esta carpeta: `python -m http.server 8787 --directory docs`. Abrir `http://localhost:8787`. No abrir `index.html` con doble clic: los módulos necesitan HTTP.

## Publicar en GitHub Pages
Subir este repositorio a GitHub. En Settings → Pages, elegir **Deploy from a branch**, rama **main**, carpeta **/docs**, y guardar. GitHub mostrará el enlace HTTPS al terminar la publicación. En repositorios privados, Pages depende del plan de la cuenta. El sitio de Pages generalmente es público, aunque el código sea privado.

En iPhone: abrir el enlace en Safari, girar el teléfono y tocar Entrar. Si está bloqueada la rotación, desactivarla desde el Centro de control. El audio se inicia tras una interacción. También se puede usar Compartir → Agregar a pantalla de inicio; esta prueba requiere conexión para cargar y no incluye modo sin conexión.

## Controles
Táctil: flechas, golpe, patada, defensa, poder, especial. Abajo + patada: barrida; abajo + defensa: guardia baja.
Teclado: A/D mover, W saltar, S agacharse, F golpe, G patada, H defensa, R poder, T especial, Escape pausa.

## Validación
`npm test` o `node --test tests/combat.test.js`. Pruebas de daño único, alcance, defensa alta/baja, energía, proyectiles, avance de rounds y simulación de los 16 cruces entre personajes.

## Archivos
`docs/` contiene toda la aplicación estática, sin dependencias externas ni backend. `prepare_assets.py` reproduce la preparación de recursos a partir del proyecto de Windows vecino; no es necesario para jugar ni publicar. Los archivos originales y fotos de referencia no se incluyen.
