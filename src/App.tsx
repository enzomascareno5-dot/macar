import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import RecetaEditor from './components/RecetaEditor'
import PanelBackup from './components/PanelBackup'
import { importarTexto } from './lib/backup'
import { borrarFoto, cargarFoto, cargarRecetas, guardarFoto, guardarRecetas } from './lib/db'
import { nuevoId, recetaVacia, type Receta } from './lib/types'

type EstadoGuardado = 'inicial' | 'guardando' | 'guardado'

export default function App() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [listo, setListo] = useState(false)
  const [estado, setEstado] = useState<EstadoGuardado>('inicial')
  const [backupAbierto, setBackupAbierto] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Las recetas viven solo acá, así que le pedimos al navegador que no las
  // descarte cuando ande corto de espacio.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  // Carga inicial desde IndexedDB.
  useEffect(() => {
    let vivo = true
    cargarRecetas()
      .then((datos) => {
        if (!vivo) return
        setRecetas(datos)
        setSeleccionadaId(datos[0]?.id ?? null)
      })
      .finally(() => {
        if (vivo) setListo(true)
      })
    return () => {
      vivo = false
    }
  }, [])

  // Autoguardado con debounce: no hay botón de guardar.
  useEffect(() => {
    if (!listo) return
    setEstado('guardando')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      guardarRecetas(recetas).then(() => setEstado('guardado'))
    }, 350)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [recetas, listo])

  const seleccionada = recetas.find((r) => r.id === seleccionadaId) ?? null

  const actualizarReceta = useCallback((id: string, cambios: Partial<Receta>) => {
    setRecetas((previas) =>
      previas.map((r) => (r.id === id ? { ...r, ...cambios, actualizadaEn: Date.now() } : r)),
    )
  }, [])

  function nuevaReceta() {
    const receta = recetaVacia()
    setRecetas((previas) => [receta, ...previas])
    setSeleccionadaId(receta.id)
    setBusqueda('')
  }

  async function duplicarReceta(receta: Receta) {
    let fotoId: string | null = null
    if (receta.fotoId) {
      const blob = await cargarFoto(receta.fotoId)
      if (blob) {
        fotoId = nuevoId()
        await guardarFoto(fotoId, blob)
      }
    }

    const copia: Receta = {
      ...receta,
      id: nuevoId(),
      nombre: `${receta.nombre} (copia)`,
      fotoId,
      ingredientes: receta.ingredientes.map((ing) => ({ ...ing, id: nuevoId() })),
      creadaEn: Date.now(),
      actualizadaEn: Date.now(),
    }

    setRecetas((previas) => {
      const i = previas.findIndex((r) => r.id === receta.id)
      const copiadas = [...previas]
      copiadas.splice(i + 1, 0, copia)
      return copiadas
    })
    setSeleccionadaId(copia.id)
  }

  async function borrarReceta(receta: Receta) {
    const ok = window.confirm(
      `¿Borrar "${receta.nombre || 'esta receta'}"? No se puede deshacer.`,
    )
    if (!ok) return

    if (receta.fotoId) await borrarFoto(receta.fotoId)

    const restantes = recetas.filter((r) => r.id !== receta.id)
    setRecetas(restantes)
    if (seleccionadaId === receta.id) setSeleccionadaId(restantes[0]?.id ?? null)
  }

  async function importar(texto: string) {
    const importadas = await importarTexto(texto)
    if (importadas.length === 0) {
      throw new Error('El backup no tiene recetas.')
    }

    const reemplazar = window.confirm(
      `Se encontraron ${importadas.length} receta(s).\n\n` +
        'Aceptar: reemplazar todas las recetas actuales.\n' +
        'Cancelar: agregarlas a las que ya tenés.',
    )

    setRecetas((previas) => {
      if (reemplazar) return importadas
      const porId = new Map(previas.map((r) => [r.id, r]))
      for (const r of importadas) porId.set(r.id, r)
      return [...porId.values()]
    })
    setSeleccionadaId(importadas[0].id)
    setBackupAbierto(false)
  }

  return (
    <div className="app">
      <Sidebar
        recetas={recetas}
        seleccionadaId={seleccionadaId}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        onSeleccionar={setSeleccionadaId}
        onNueva={nuevaReceta}
        onBackup={() => setBackupAbierto(true)}
      />

      <main className="contenido">
        {seleccionada ? (
          <RecetaEditor
            key={seleccionada.id}
            receta={seleccionada}
            onCambiar={(cambios) => actualizarReceta(seleccionada.id, cambios)}
            onDuplicar={() => duplicarReceta(seleccionada)}
            onBorrar={() => borrarReceta(seleccionada)}
          />
        ) : (
          <div className="vacio">
            <img
              src="./logo.png"
              alt="Macar Pastelería"
              className="vacio-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <h1 className="vacio-titulo">Todavía no hay recetas</h1>
            <p className="vacio-texto">
              Creá tu primera receta, cargá los ingredientes y la app te calcula el costo y el
              precio de venta al instante.
            </p>
            <button type="button" className="btn-nueva btn-nueva-grande" onClick={nuevaReceta}>
              + Nueva receta
            </button>
          </div>
        )}
      </main>

      {backupAbierto && (
        <PanelBackup
          recetas={recetas}
          onCerrar={() => setBackupAbierto(false)}
          onImportarTexto={importar}
        />
      )}

      <span className={`estado estado-${estado}`} aria-live="polite">
        {estado === 'guardando' ? 'Guardando…' : estado === 'guardado' ? 'Guardado' : ''}
      </span>
    </div>
  )
}
