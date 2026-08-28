import { useMemo } from 'react'
import FotoReceta from './FotoReceta'
import { calcularReceta, parseNum } from '../lib/calc'
import { money, num, pct } from '../lib/format'
import { ingredienteVacio, UNIDADES, type Ingrediente, type Receta } from '../lib/types'

interface Props {
  receta: Receta
  onCambiar: (cambios: Partial<Receta>) => void
  onDuplicar: () => void
  onBorrar: () => void
}

const PLACEHOLDER_PASOS = [
  'Un paso por línea…',
  'Batir la manteca con el azúcar',
  'Agregar los huevos de a uno',
].join('\n')

export default function RecetaEditor({ receta, onCambiar, onDuplicar, onBorrar }: Props) {
  const calc = useMemo(() => calcularReceta(receta), [receta])

  const pasos = receta.pasos
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)

  function cambiarIngrediente(id: string, cambios: Partial<Ingrediente>) {
    onCambiar({
      ingredientes: receta.ingredientes.map((ing) =>
        ing.id === id ? { ...ing, ...cambios } : ing,
      ),
    })
  }

  function agregarIngrediente() {
    onCambiar({ ingredientes: [...receta.ingredientes, ingredienteVacio()] })
  }

  function quitarIngrediente(id: string) {
    const restantes = receta.ingredientes.filter((ing) => ing.id !== id)
    onCambiar({ ingredientes: restantes.length ? restantes : [ingredienteVacio()] })
  }

  return (
    <section className="editor">
      <header className="editor-encabezado">
        <FotoReceta fotoId={receta.fotoId} onCambiarFoto={(fotoId) => onCambiar({ fotoId })} />

        <div className="encabezado-datos">
          <input
            className="input-nombre"
            value={receta.nombre}
            placeholder="Nombre de la receta"
            onChange={(e) => onCambiar({ nombre: e.target.value })}
          />

          <div className="encabezado-campos">
            <label className="campo">
              <span className="campo-label">Rinde</span>
              <span className="campo-linea">
                <input
                  className="input-num input-corto"
                  type="text"
                  inputMode="decimal"
                  value={receta.porciones}
                  onChange={(e) => onCambiar({ porciones: e.target.value })}
                />
                <span className="campo-sufijo">porciones</span>
              </span>
            </label>

            <label className="campo">
              <span className="campo-label">Precio</span>
              <span className="campo-linea">
                <span className="campo-sufijo">= costo ×</span>
                <input
                  className="input-num input-corto"
                  type="text"
                  inputMode="decimal"
                  value={receta.multiplicador}
                  onChange={(e) => onCambiar({ multiplicador: e.target.value })}
                />
              </span>
            </label>
          </div>

          <div className="encabezado-acciones">
            <button type="button" className="btn-chico" onClick={onDuplicar}>
              Duplicar
            </button>
            <button type="button" className="btn-chico btn-peligro" onClick={onBorrar}>
              Borrar receta
            </button>
          </div>
        </div>
      </header>

      <div className="editor-cuerpo">
        <div className="columna-principal">
          <div className="bloque">
            <h2 className="bloque-titulo">Ingredientes</h2>

            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th className="col-nombre">Ingrediente</th>
                    <th className="col-num">Cant. bruta</th>
                    <th className="col-unidad">Unidad</th>
                    <th className="col-num">Cant. neta</th>
                    <th className="col-num">Múltiplo</th>
                    <th className="col-num">Precio unitario</th>
                    <th className="col-num">Precio total</th>
                    <th className="col-num">% costo</th>
                    <th className="col-borrar" aria-label="Borrar" />
                  </tr>
                </thead>
                <tbody>
                  {receta.ingredientes.map((ing) => {
                    const c = calc.porIngrediente[ing.id]
                    return (
                      <tr key={ing.id}>
                        <td>
                          <input
                            className="celda"
                            value={ing.nombre}
                            placeholder="Ej: harina 0000"
                            onChange={(e) => cambiarIngrediente(ing.id, { nombre: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="celda celda-num"
                            type="text"
                            inputMode="decimal"
                            value={ing.cantidadBruta}
                            placeholder="—"
                            onChange={(e) =>
                              cambiarIngrediente(ing.id, { cantidadBruta: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="celda celda-unidad"
                            list="unidades"
                            value={ing.unidad}
                            onChange={(e) => cambiarIngrediente(ing.id, { unidad: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="celda celda-num"
                            type="text"
                            inputMode="decimal"
                            value={ing.cantidadNeta}
                            placeholder="0"
                            onChange={(e) =>
                              cambiarIngrediente(ing.id, { cantidadNeta: e.target.value })
                            }
                          />
                        </td>
                        <td className="dato dato-suave">
                          {!c || c.multiplo === null ? '—' : num(c.multiplo)}
                        </td>
                        <td>
                          <input
                            className="celda celda-num"
                            type="text"
                            inputMode="decimal"
                            value={ing.precioUnitario}
                            placeholder="0"
                            onChange={(e) =>
                              cambiarIngrediente(ing.id, { precioUnitario: e.target.value })
                            }
                          />
                        </td>
                        <td className="dato dato-fuerte">{money(c?.precioTotal ?? 0)}</td>
                        <td className="dato dato-suave">{pct(c?.porcentaje ?? 0)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-borrar-fila"
                            title="Borrar ingrediente"
                            onClick={() => quitarIngrediente(ing.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <datalist id="unidades">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>

            <button type="button" className="btn-agregar" onClick={agregarIngrediente}>
              + Agregar ingrediente
            </button>

            <p className="nota">
              Si dejás la cantidad bruta vacía o en 0 (packaging, bizcochuelo comprado), el precio
              total es el precio unitario × la cantidad neta.
            </p>
          </div>

          <div className="bloque">
            <h2 className="bloque-titulo">Procedimiento</h2>
            <textarea
              className="pasos-input"
              value={receta.pasos}
              placeholder={PLACEHOLDER_PASOS}
              rows={8}
              onChange={(e) => onCambiar({ pasos: e.target.value })}
            />
            {pasos.length > 0 && (
              <ol className="pasos-lista">
                {pasos.map((paso, i) => (
                  <li key={i}>{paso}</li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <aside className="columna-ticket">
          <div className="ticket">
            <h2 className="ticket-titulo">Resultado</h2>

            <div className="ticket-fila">
              <span className="ticket-label">Costo total</span>
              <span className="ticket-valor">{money(calc.total)}</span>
            </div>

            <div className="ticket-fila">
              <span className="ticket-label">
                Ganancia <em className="ticket-pct">{pct(calc.gananciaPct)}</em>
              </span>
              <span className="ticket-valor">{money(calc.ganancia)}</span>
            </div>

            <div className="ticket-separador" />

            <div className="ticket-precio">
              <span className="ticket-precio-label">Precio de venta</span>
              <strong className="ticket-precio-valor">{money(calc.precioVenta)}</strong>
            </div>

            <div className="ticket-porcion">
              <div className="ticket-porcion-texto">
                <span className="ticket-label">Por porción</span>
                <span className="ticket-porcion-detalle">
                  {num(parseNum(receta.porciones))} porciones
                </span>
              </div>
              <strong className="ticket-porcion-valor">{money(calc.porPorcion)}</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Solo en celular: el precio siempre visible mientras cargás ingredientes.
          Duplica lo del ticket, así que no se anuncia a lectores de pantalla. */}
      <div className="barra-precio" aria-hidden="true">
        <div className="barra-item">
          <span className="barra-label">Venta</span>
          <strong className="barra-valor">{money(calc.precioVenta)}</strong>
        </div>
        <div className="barra-item barra-item-secundario">
          <span className="barra-label">Porción</span>
          <strong className="barra-valor-chico">{money(calc.porPorcion)}</strong>
        </div>
      </div>
    </section>
  )
}
