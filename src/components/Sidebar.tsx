import { moneyCorto } from '../lib/format'
import type { Receta } from '../lib/types'
import { calcularReceta } from '../lib/calc'

interface Props {
  recetas: Receta[]
  seleccionadaId: string | null
  busqueda: string
  onBuscar: (valor: string) => void
  onSeleccionar: (id: string) => void
  onNueva: () => void
  onBackup: () => void
}

export default function Sidebar({
  recetas,
  seleccionadaId,
  busqueda,
  onBuscar,
  onSeleccionar,
  onNueva,
  onBackup,
}: Props) {
  const filtro = busqueda.trim().toLowerCase()
  const visibles = filtro
    ? recetas.filter(
        (r) =>
          r.nombre.toLowerCase().includes(filtro) ||
          r.ingredientes.some((i) => i.nombre.toLowerCase().includes(filtro)),
      )
    : recetas

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* En celular el lockup completo queda ilegible a 44 px de alto:
            se muestra el isotipo. El cambio lo hace CSS, no <picture>, para que
            sea igual de confiable al rotar el teléfono. */}
        <div className="marca">
          <img
            src="./logo.png"
            alt="Macar Pastelería"
            className="logo logo-completo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <img
            src="./isotipo.png"
            alt="Macar Pastelería"
            className="logo logo-isotipo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        <button type="button" className="btn-nueva" onClick={onNueva}>
          + Nueva receta
        </button>

        <input
          type="search"
          className="buscador"
          placeholder="Buscar receta o ingrediente…"
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
        />
      </div>

      <div className="lista">
        {visibles.length === 0 && (
          <p className="lista-vacia">
            {recetas.length === 0
              ? 'Todavía no cargaste ninguna receta.'
              : 'No hay recetas que coincidan.'}
          </p>
        )}

        {visibles.map((receta) => {
          const calc = calcularReceta(receta)
          return (
            <button
              type="button"
              key={receta.id}
              className={`item ${receta.id === seleccionadaId ? 'item-activo' : ''}`}
              onClick={() => onSeleccionar(receta.id)}
            >
              <span className="item-nombre">{receta.nombre || 'Sin nombre'}</span>
              <span className="item-precios">
                <span className="item-venta">{moneyCorto(calc.precioVenta)}</span>
                <span className="item-porcion">{moneyCorto(calc.porPorcion)} /porción</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="sidebar-pie">
        <button type="button" className="btn-chico" onClick={onBackup}>
          Backup
        </button>
      </div>
    </aside>
  )
}
