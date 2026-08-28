// Los campos numéricos se guardan como texto para que se pueda escribir
// libremente (vacío, "1,", "0.") sin que el input se pelee con el estado.
// El parseo a número vive en calc.ts.

export interface Ingrediente {
  id: string
  nombre: string
  cantidadBruta: string
  unidad: string
  cantidadNeta: string
  precioUnitario: string
}

export interface Receta {
  id: string
  nombre: string
  porciones: string
  multiplicador: string
  pasos: string
  fotoId: string | null
  ingredientes: Ingrediente[]
  creadaEn: number
  actualizadaEn: number
}

export const UNIDADES = ['g', 'kg', 'ml', 'l', 'u', 'cda', 'cdta', 'taza', 'pack']

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function ingredienteVacio(): Ingrediente {
  return {
    id: nuevoId(),
    nombre: '',
    cantidadBruta: '',
    unidad: 'g',
    cantidadNeta: '',
    precioUnitario: '',
  }
}

export function recetaVacia(): Receta {
  const ahora = Date.now()
  return {
    id: nuevoId(),
    nombre: 'Receta nueva',
    porciones: '8',
    multiplicador: '3',
    pasos: '',
    fotoId: null,
    ingredientes: [ingredienteVacio()],
    creadaEn: ahora,
    actualizadaEn: ahora,
  }
}
