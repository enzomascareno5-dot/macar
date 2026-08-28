import { get, set, del, createStore } from 'idb-keyval'
import type { Receta } from './types'

const store = createStore('macar-recetas', 'kv')

const CLAVE_RECETAS = 'recetas'
const clavePhoto = (fotoId: string) => `foto:${fotoId}`

export async function cargarRecetas(): Promise<Receta[]> {
  const datos = await get<Receta[]>(CLAVE_RECETAS, store)
  return Array.isArray(datos) ? datos : []
}

export async function guardarRecetas(recetas: Receta[]): Promise<void> {
  await set(CLAVE_RECETAS, recetas, store)
}

export async function guardarFoto(fotoId: string, blob: Blob): Promise<void> {
  await set(clavePhoto(fotoId), blob, store)
}

export async function cargarFoto(fotoId: string): Promise<Blob | undefined> {
  return get<Blob>(clavePhoto(fotoId), store)
}

export async function borrarFoto(fotoId: string): Promise<void> {
  await del(clavePhoto(fotoId), store)
}
