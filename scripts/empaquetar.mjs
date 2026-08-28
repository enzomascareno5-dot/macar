// Aplasta el build de Vite en un solo HTML autocontenido (CSS, JS e imágenes
// embebidos), listo para publicar como Artifact o subir a cualquier lado.
//
//   npm run build && npm run empaquetar
//
// Sale en dist/macar-recetas.html
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(raiz, 'dist')
const assets = join(dist, 'assets')

const archivos = readdirSync(assets)
const nombreCss = archivos.find((f) => f.endsWith('.css'))
const nombreJs = archivos.find((f) => f.endsWith('.js'))
if (!nombreCss || !nombreJs) {
  throw new Error('Faltan el CSS o el JS en dist/assets. ¿Corriste "npm run build"?')
}

const css = readFileSync(join(assets, nombreCss), 'utf8')
let js = readFileSync(join(assets, nombreJs), 'utf8')

// scripts/embed/ tiene los mismos logos pero reducidos (360 y 160 px de alto).
// Embeber los de public/ en tamaño original triplicaría el peso del archivo
// para nada: en pantalla se ven a 62 px como mucho.
const dataUrl = (nombre) => {
  const reducido = join(raiz, 'scripts', 'embed', nombre)
  const ruta = existsSync(reducido) ? reducido : join(raiz, 'public', nombre)
  return 'data:image/png;base64,' + readFileSync(ruta).toString('base64')
}

for (const nombre of ['logo.png', 'isotipo.png']) {
  const ref = `"./${nombre}"`
  const cuantas = js.split(ref).length - 1
  if (cuantas === 0) throw new Error(`No se encontró la referencia a ${nombre} en el bundle`)
  js = js.split(ref).join(JSON.stringify(dataUrl(nombre)))
  console.log(`${nombre}: ${cuantas} referencia(s) embebida(s)`)
}

// Un "</script" dentro del bundle cerraría la etiqueta antes de tiempo.
js = js.split('</script').join('<\\/script')

const fuentes =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap'

// Sin <!doctype>, <html>, <head> ni <body>: el visor de Artifacts envuelve
// el archivo en su propio esqueleto.
const html = `<title>Macar Recetas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fuentes}">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`

const salida = join(dist, 'macar-recetas.html')
writeFileSync(salida, html, 'utf8')
console.log(`\n${salida}  ·  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`)
