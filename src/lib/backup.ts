import { cargarFoto, guardarFoto } from './db'
import { blobADataUrl, dataUrlABlob } from './image'
import { ingredienteVacio, nuevoId, type Ingrediente, type Receta } from './types'

const MARCA = 'macar-recetas'
const VERSION = 1

interface Backup {
  app: string
  version: number
  exportadoEn: string
  recetas: Receta[]
  fotos: Record<string, string>
}

export function nombreBackup(): string {
  return `macar-recetas-${new Date().toISOString().slice(0, 10)}.json`
}

export async function armarBackup(recetas: Receta[], incluirFotos: boolean): Promise<string> {
  const fotos: Record<string, string> = {}

  if (incluirFotos) {
    for (const receta of recetas) {
      if (!receta.fotoId) continue
      const blob = await cargarFoto(receta.fotoId)
      if (blob) fotos[receta.fotoId] = await blobADataUrl(blob)
    }
  }

  const backup: Backup = {
    app: MARCA,
    version: VERSION,
    exportadoEn: new Date().toISOString(),
    // Sin fotos, las recetas igual conservan su fotoId: si después importás
    // un backup completo, las imágenes se vuelven a enganchar solas.
    recetas,
    fotos,
  }

  return JSON.stringify(backup, null, 2)
}

/* ---------- Bajar el archivo ---------- */

/**
 * Publicada como Artifact, la app corre en un visor que ignora los links de
 * descarga: ahí el archivo se entrega con la capability `downloads`, que no
 * está disponible en artifacts compartidos por link. Servida normal (dev o
 * build propio) no existe `window.claude` y el <a download> anda perfecto.
 */
interface ClaudeDownloads {
  save(req: { filename: string; data: string | Blob }): Promise<{ status: string }>
}

interface ClaudeRuntime {
  use(nombre: string): Promise<ClaudeDownloads | null>
}

export type ModoDescarga = 'nativo' | 'capability' | 'ninguno'

let modoDetectado: Promise<ModoDescarga> | null = null

export function detectarDescarga(): Promise<ModoDescarga> {
  if (!modoDetectado) {
    const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude
    modoDetectado =
      runtime && typeof runtime.use === 'function'
        ? runtime.use('downloads').then((d) => (d ? 'capability' : 'ninguno'))
        : Promise.resolve<ModoDescarga>('nativo')
  }
  return modoDetectado
}

const MENSAJES: Record<string, string> = {
  declined: '',
  too_large: 'El backup pesa más de 16 MB. Probá guardándolo sin las fotos.',
  rate_limited: 'Hay otra descarga esperando confirmación. Probá de nuevo en un momento.',
}

export async function bajarBackup(json: string): Promise<void> {
  const modo = await detectarDescarga()

  if (modo === 'capability') {
    const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude!
    const downloads = await runtime.use('downloads')
    try {
      await downloads!.save({ filename: nombreBackup(), data: json })
    } catch (e) {
      const codigo = (e as { code?: string })?.code ?? 'unavailable'
      const mensaje = MENSAJES[codigo]
      if (mensaje === '') return // canceló, no es un error
      throw new Error(mensaje ?? 'No se pudo bajar el backup.')
    }
    return
  }

  if (modo === 'ninguno') {
    throw new Error('Acá no se pueden bajar archivos. Copiá el texto del backup.')
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreBackup()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copiarAlPortapapeles(texto: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Tu navegador no deja copiar solo. Seleccioná el texto y copialo a mano.')
  }
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    throw new Error('No se pudo copiar. Seleccioná el texto y copialo a mano.')
  }
}

/* ---------- Importar ---------- */

export async function importarJSON(file: File): Promise<Receta[]> {
  return importarTexto(await file.text())
}

export async function importarTexto(texto: string): Promise<Receta[]> {
  let datos: Partial<Backup>
  try {
    datos = JSON.parse(texto) as Partial<Backup>
  } catch {
    throw new Error('Eso no es un backup válido: el texto está incompleto o cortado.')
  }

  if (!datos || !Array.isArray(datos.recetas)) {
    throw new Error('El archivo no tiene el formato de un backup de Macar.')
  }

  const fotos = datos.fotos ?? {}
  for (const [fotoId, dataUrl] of Object.entries(fotos)) {
    if (typeof dataUrl !== 'string') continue
    try {
      await guardarFoto(fotoId, await dataUrlABlob(dataUrl))
    } catch {
      // Si una foto falla, la receta se importa igual sin imagen.
    }
  }

  return datos.recetas.map(normalizarReceta)
}

const texto = (v: unknown, porDefecto = '') =>
  v === null || v === undefined ? porDefecto : String(v)

function normalizarIngrediente(ing: Partial<Ingrediente>): Ingrediente {
  const base = ingredienteVacio()
  return {
    id: texto(ing?.id) || base.id,
    nombre: texto(ing?.nombre),
    cantidadBruta: texto(ing?.cantidadBruta),
    unidad: texto(ing?.unidad, 'g'),
    cantidadNeta: texto(ing?.cantidadNeta),
    precioUnitario: texto(ing?.precioUnitario),
  }
}

function normalizarReceta(receta: Partial<Receta>): Receta {
  const ahora = Date.now()
  const ingredientes = Array.isArray(receta?.ingredientes)
    ? receta.ingredientes.map(normalizarIngrediente)
    : []
  return {
    id: texto(receta?.id) || nuevoId(),
    nombre: texto(receta?.nombre, 'Receta sin nombre'),
    porciones: texto(receta?.porciones, '1'),
    multiplicador: texto(receta?.multiplicador, '3'),
    pasos: texto(receta?.pasos),
    fotoId: receta?.fotoId ? texto(receta.fotoId) : null,
    ingredientes: ingredientes.length ? ingredientes : [ingredienteVacio()],
    creadaEn: typeof receta?.creadaEn === 'number' ? receta.creadaEn : ahora,
    actualizadaEn: typeof receta?.actualizadaEn === 'number' ? receta.actualizadaEn : ahora,
  }
}
