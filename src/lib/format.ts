const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pesosCortos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const decimal = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const seguro = (n: number) => (Number.isFinite(n) ? n : 0)

export const money = (n: number) => pesos.format(seguro(n))
export const moneyCorto = (n: number) => pesosCortos.format(seguro(n))
export const num = (n: number) => decimal.format(seguro(n))
export const pct = (n: number) => `${decimal.format(seguro(n))} %`
