import type { Ingrediente, Receta } from './types'

/** Acepta "1.234,56" y "1234.56". Devuelve 0 si no hay número. */
export function parseNum(valor: string): number {
  if (typeof valor !== 'string') valor = String(valor ?? '')
  const limpio = valor.trim().replace(/\s/g, '')
  if (!limpio) return 0
  // Si tiene coma, la coma es el separador decimal y el punto es de miles.
  const normalizado = limpio.includes(',')
    ? limpio.replace(/\./g, '').replace(',', '.')
    : limpio
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : 0
}

export interface CalculoIngrediente {
  multiplo: number | null
  precioTotal: number
  porcentaje: number
}

/**
 * Fórmula del Excel de Macar:
 *   multiplo = cantidadBruta / cantidadNeta
 *   precioTotal = precioUnitario / multiplo
 * Si la cantidad bruta está vacía o en 0 (packaging, bizcochuelo comprado):
 *   precioTotal = precioUnitario * (cantidadNeta || 1)
 */
export function calcularIngrediente(ing: Ingrediente): Omit<CalculoIngrediente, 'porcentaje'> {
  const bruta = parseNum(ing.cantidadBruta)
  const neta = parseNum(ing.cantidadNeta)
  const precioUnitario = parseNum(ing.precioUnitario)

  if (!bruta) {
    return { multiplo: null, precioTotal: precioUnitario * (neta || 1) }
  }
  if (!neta) {
    return { multiplo: null, precioTotal: 0 }
  }
  const multiplo = bruta / neta
  return { multiplo, precioTotal: precioUnitario / multiplo }
}

export interface CalculoReceta {
  porIngrediente: Record<string, CalculoIngrediente>
  total: number
  precioVenta: number
  porPorcion: number
  ganancia: number
  gananciaPct: number
}

export function calcularReceta(receta: Receta): CalculoReceta {
  const parciales = receta.ingredientes.map((ing) => ({
    id: ing.id,
    ...calcularIngrediente(ing),
  }))

  const total = parciales.reduce((acc, p) => acc + p.precioTotal, 0)
  const multiplicador = parseNum(receta.multiplicador)
  const porciones = parseNum(receta.porciones)

  const precioVenta = total * multiplicador
  const porPorcion = porciones > 0 ? precioVenta / porciones : 0
  const ganancia = precioVenta - total
  const gananciaPct = (multiplicador - 1) * 100

  const porIngrediente: Record<string, CalculoIngrediente> = {}
  for (const p of parciales) {
    porIngrediente[p.id] = {
      multiplo: p.multiplo,
      precioTotal: p.precioTotal,
      porcentaje: total > 0 ? (p.precioTotal / total) * 100 : 0,
    }
  }

  return { porIngrediente, total, precioVenta, porPorcion, ganancia, gananciaPct }
}
