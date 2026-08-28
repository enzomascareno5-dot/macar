# Macar · Costos de recetas

App web personal para cargar recetas de la pastelería y calcular costo y precio de venta.
Sin backend: todo se guarda solo en IndexedDB del navegador y funciona offline.

## Arrancar

```bash
npm install
npm run dev
```

> En esta máquina Node está en `C:\Program Files\nodejs` pero no en el PATH.
> Si `npm` no se reconoce, abrí la terminal y corré primero:
> `$env:Path = "C:\Program Files\nodejs;" + $env:Path`

- `npm run dev` → servidor de desarrollo en http://localhost:5173
- `npm run build` → versión de producción en `dist/`
- `npm run preview` → sirve `dist/` para probarlo

## El logo

Está en `public/logo.png` (1044×841, PNG con fondo transparente). Se muestra arriba a la
izquierda con 62 px de alto, y más grande en el estado vacío.

Se generó a partir de `Downloads\1x\Recurso 1-100.jpg`: el JPEG venía con fondo blanco, así
que se le sacó el blanco **solo del exterior** (flood fill desde los bordes) para que el
gorro y la panza del hámster, que también son blancos, quedaran intactos. Después se
recortaron los márgenes transparentes.

También está el isotipo (hámster + "m") en `public/isotipo.png`, generado igual a partir de
`Downloads\1x\1x\Recurso 2-100.jpg`. Se usa en celular, donde el lockup completo a 44 px de
alto quedaría ilegible, y como base de los iconos:

- `public/favicon.png` — 256×256, transparente, para la pestaña
- `public/apple-touch-icon.png` — 180×180 con fondo `#FFFAFB`, porque iOS no respeta la
  transparencia y el icono quedaría sobre negro al agregarlo a la pantalla de inicio

Si algún día los reemplazás por otros archivos, alcanza con pisarlos. Y si no están, la app
funciona igual: el logo simplemente no se muestra.

## Celular

- El logo de la barra pasa al isotipo abajo de 820 px (el cambio lo hace CSS, no `<picture>`,
  para que sea confiable al rotar el teléfono).
- Todo lo tipeable va a 16 px: abajo de eso iOS hace zoom solo al enfocar un input.
- Campos de la tabla y botones con 44 px de alto mínimo.
- La lista de recetas va arriba en scroll horizontal y la barra lateral queda en flujo normal
  (no fija: en un celular se comería media pantalla).
- La tabla scrollea a lo ancho con la **columna del ingrediente fija**, así siempre sabés qué
  fila estás editando. La página en sí nunca scrollea horizontalmente.
- **Barra de precio fija abajo** con venta y precio por porción, para verlos mientras cargás
  ingredientes sin tener que bajar hasta el ticket.
- Se respetan las safe areas (notch y barra de gestos) con `env(safe-area-inset-*)`.
- Con `apple-mobile-web-app-capable` se puede agregar a la pantalla de inicio y abre sin la
  barra del navegador.

## La fórmula (la del Excel)

Por ingrediente:

- `multiplo = cantidadBruta / cantidadNeta`
- `precioTotalIngrediente = precioUnitario / multiplo`
- Si `cantidadBruta` está vacía o en 0 (packaging, bizcochuelo comprado):
  `precioTotalIngrediente = precioUnitario * (cantidadNeta || 1)`

De la receta:

- `TOTAL = suma de los precios totales`
- `precioVenta = TOTAL * multiplicador`
- `porPorcion = precioVenta / porciones`
- `ganancia = precioVenta - TOTAL`
- `gananciaPct = (multiplicador - 1) * 100`
- `% costo` de cada ingrediente = su precio total sobre el TOTAL

Todo eso vive en [`src/lib/calc.ts`](src/lib/calc.ts).

## Guardado

No hay botón de guardar: cada cambio se escribe en IndexedDB con un debounce de 350 ms.
Abajo a la derecha aparece "Guardando… / Guardado".

Al arrancar se llama a `navigator.storage.persist()`. Es un **pedido**, no una garantía: el
navegador lo concede según su criterio, y lo que más pesa es que la app esté instalada en la
pantalla de inicio. Se puede chequear en cualquier momento con
`await navigator.storage.persisted()` desde la consola.

- Recetas: store `macar-recetas`, clave `recetas`
- Fotos: misma store, clave `foto:<id>`, guardadas como Blob JPEG de 1000×1000
  (recorte cuadrado al centro, calidad 0.85)

Al borrar una receta también se borra su foto.

## Publicar en GitHub Pages (la casa definitiva de la app)

Es el lugar donde conviene que viva, no el artifact. Motivo: los datos se guardan por
dominio, y en GitHub Pages la app tiene dominio propio. Ahí el navegador la trata como sitio
de primera mano, deja instalarla en la pantalla de inicio y — una vez instalada — se
compromete a no borrarle el almacenamiento. Dentro del iframe del artifact nada de eso
aplica: Safari en iPhone puede descartar el almacenamiento de un iframe ajeno a los pocos
días.

Ya está el repo iniciado y commiteado, y el workflow de Actions en
`.github/workflows/deploy.yml`. Falta:

1. Crear un repo vacío en github.com (público; con cuenta gratis, Pages solo funciona en
   repos públicos). El código no tiene nada sensible: ninguna receta viaja al repo.
2. Conectarlo y pushear:

   ```bash
   git remote add origin https://github.com/USUARIO/REPO.git
   git push -u origin main
   ```

3. En el repo: **Settings → Pages → Source: GitHub Actions**.

Queda en `https://USUARIO.github.io/REPO/`. Cada `git push` a `main` la reconstruye y
republica sola.

El `base: './'` de [vite.config.ts](vite.config.ts) hace que ande en cualquier subcarpeta,
así que el nombre del repo no importa.

### Que se instale en la pantalla de inicio

Es el paso que protege los datos, y lo tiene que hacer ella una vez:

- **iPhone (Safari):** Compartir → "Agregar a inicio"
- **Android (Chrome):** menú de tres puntos → "Instalar app"

A partir de ahí abre sin barra del navegador y el almacenamiento pasa a ser durable.

## Versión publicada como Artifact (preview)

https://claude.ai/code/artifact/785bf4d5-612b-4d24-a9ee-ce0c86582a58

Es la misma app aplastada en un solo HTML autocontenido (CSS, JS y logos embebidos como
data URIs, 336 KB). Para regenerarlo después de tocar el código:

```bash
npm run build && npm run empaquetar
```

Sale en `dist/macar-recetas.html`. Los logos que se embeben salen de `scripts/embed/`, que
son los mismos de `public/` pero reducidos a 360 y 160 px de alto: en pantalla no se ven a
más de 62 px, y embeberlos en tamaño original triplicaría el peso del archivo.

**Ojo con los datos:** la versión publicada y la local son dos IndexedDB distintas, porque
son dominios distintos. Las recetas que cargues en una no aparecen en la otra. El puente es
exportar el backup de una e importarlo en la otra.

## Backup

- **Exportar backup** baja un `.json` con todas las recetas y las fotos embebidas en base64.
- **Importar** te pregunta si querés reemplazar todo o sumar las recetas del archivo a las
  que ya tenés. Las recetas con el mismo id se pisan con las del backup.

En la versión publicada el link de descarga no alcanza: el visor de artifacts no le da
permiso de bajar archivos a la página. Para eso hay que declarar la capability `downloads`,
que **no se permite en artifacts compartidos por link**. `bajarArchivo()` en
[backup.ts](src/lib/backup.ts) ya contempla los dos caminos: usa `claude.use('downloads')`
cuando existe y cae al `<a download>` cuando no. O sea que alcanza con apagar el link
público desde el menú Share del artifact y volver a publicar con la capability activada.

## Estructura

```
scripts/
  empaquetar.mjs           arma el HTML autocontenido para publicar
  embed/                   logos reducidos, solo para embeber
src/
  App.tsx                  estado global, autoguardado, alta/duplicar/borrar/importar
  styles.css               paleta, tipografías y layout responsive
  components/
    Sidebar.tsx            buscador, lista de recetas, backup
    RecetaEditor.tsx       encabezado, tabla, procedimiento y ticket
    FotoReceta.tsx         subir/cambiar/quitar foto
  lib/
    types.ts               modelo de datos
    calc.ts                la fórmula
    format.ts              formato es-AR con $
    db.ts                  IndexedDB (idb-keyval)
    image.ts               redimensionado a JPEG 1000×1000
    backup.ts              exportar / importar JSON
```

## Una nota sobre el modelo

Los campos numéricos (`cantidadBruta`, `cantidadNeta`, `precioUnitario`, `porciones`,
`multiplicador`) se guardan como texto, no como número. Es a propósito: así se puede
escribir libremente `""`, `"1,"` o `"0."` sin que el input se pelee con el estado ni se
pierda el foco. El parseo (que acepta coma o punto decimal) está en `parseNum()`.
