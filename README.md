# Flauers

Floristería web con un diferencial: eliges flores del catálogo, armas tu ramo en **3D** y lo regalas con un **link**. Quien lo abre ve el ramo en 3D y lo gira con el mouse (o el dedo).

## Qué incluye

- **Catálogo** de 14 flores comerciales (rosa, tulipán, girasol, lirio, margarita, orquídea, clavel, peonía, lavanda, hortensia, gerbera, crisantemo, paniculata y eucalipto). Cada card tiene imagen, título, botón *Saber más* (ficha flotante con origen, significado, temporada, duración, cuidados y curiosidades) y selección múltiple al hacer clic.
- **Ramos prearmados** en el inicio, con link de regalo directo o apertura en el taller para personalizarlos.
- **Taller 3D** (`#/armar`): cantidades, color de cada flor, papel, lazo y dedicatoria, con el ramo reconstruyéndose en vivo.
- **Vista de regalo** (`#/regalo/<código>`): pantalla completa con el ramo en 3D, el mensaje y quién lo envía.

Todas las flores son **modelos 3D procedurales** generados en el navegador con Three.js: no hay fotos ni archivos de modelos que descargar. Las imágenes del catálogo se renderizan a partir de los mismos modelos.

El ramo viaja **dentro del link** (codificado en el hash de la URL), así que no hace falta servidor ni base de datos: la web se publica como sitio estático.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en dist/
npm run preview  # sirve dist/
```

Stack: Vite · React · Three.js.

## Estructura

```
src/
  data/       catálogo de flores, ramos prearmados, papeles y lazos
  three/      geometría de pétalos, generadores de flores, armado del ramo, escena y miniaturas
  components/ cards, fichas, visor 3D, barra de selección, modal de compartir
  pages/      Home, Builder (taller), Gift (vista de regalo)
  lib/        router por hash y codificación del link de regalo
```
