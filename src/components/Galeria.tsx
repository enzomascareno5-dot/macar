import { useMemo } from 'react'
import { calcularReceta, parseNum } from '../lib/calc'
import { moneyCorto, num } from '../lib/format'
import { useFotoUrl } from '../lib/useFotoUrl'
import type { Receta } from '../lib/types'

interface Props {
  recetas: Receta[]
  busqueda: string
  onAbrir: (id: string) => void
  onNueva: () => void
}

export default function Galeria({ recetas, busqueda, onAbrir, onNueva }: Props) {
  const filtro = busqueda.trim().toLowerCase()

  const visibles = useMemo(
    () =>
      filtro
        ? recetas.filter(
            (r) =>
              r.nombre.toLowerCase().includes(filtro) ||
              r.ingredientes.some((i) => i.nombre.toLowerCase().includes(filtro)),
          )
        : recetas,
    [recetas, filtro],
  )

  return (
    <section className="galeria">
      <header className="galeria-encabezado">
        <div>
          <h1 className="galeria-titulo">Todas las recetas</h1>
          <p className="galeria-conteo">
            {filtro
              ? `${visibles.length} de ${recetas.length} ${recetas.length === 1 ? 'receta' : 'recetas'}`
              : `${recetas.length} ${recetas.length === 1 ? 'receta' : 'recetas'}`}
          </p>
        </div>
        <button type="button" className="btn-nueva" onClick={onNueva}>
          + Nueva receta
        </button>
      </header>

      {visibles.length === 0 ? (
        <p className="galeria-vacia">
          {recetas.length === 0
            ? 'Todavía no cargaste ninguna receta.'
            : 'Ninguna receta coincide con la búsqueda.'}
        </p>
      ) : (
        <div className="galeria-grilla">
          {visibles.map((receta, i) => (
            <TarjetaReceta key={receta.id} receta={receta} indice={i} onAbrir={onAbrir} />
          ))}
        </div>
      )}
    </section>
  )
}

function TarjetaReceta({
  receta,
  indice,
  onAbrir,
}: {
  receta: Receta
  indice: number
  onAbrir: (id: string) => void
}) {
  const url = useFotoUrl(receta.fotoId)
  const calc = useMemo(() => calcularReceta(receta), [receta])
  const porciones = parseNum(receta.porciones)

  // El tope del índice evita que, con muchas recetas, la última tarjeta tarde
  // una eternidad en aparecer: a partir de la doceava entran todas juntas.
  const retraso = Math.min(indice, 11)

  return (
    <button
      type="button"
      className="tarjeta"
      onClick={() => onAbrir(receta.id)}
      style={{ '--i': retraso } as React.CSSProperties}
    >
      <span className="tarjeta-foto">
        {/* Sin loading="lazy": las fotos ya están en el disco del teléfono, no
            hay red que ahorrar, y el lazy solo retrasa lo que ya está a mano. */}
        {url ? (
          <img src={url} alt="" />
        ) : (
          <span className="tarjeta-sinfoto" aria-hidden="true">
            🍰
          </span>
        )}
      </span>

      <span className="tarjeta-cuerpo">
        <span className="tarjeta-nombre">{receta.nombre || 'Sin nombre'}</span>

        <span className="tarjeta-precios">
          <span className="tarjeta-venta">{moneyCorto(calc.precioVenta)}</span>
          <span className="tarjeta-porcion">
            {moneyCorto(calc.porPorcion)} <span className="tarjeta-tenue">/porción</span>
          </span>
        </span>

        <span className="tarjeta-pie">
          {porciones > 0 ? `${num(porciones)} porciones` : 'Sin porciones'}
          <span className="tarjeta-punto" aria-hidden="true">
            ·
          </span>
          costo {moneyCorto(calc.total)}
        </span>
      </span>
    </button>
  )
}
