import { useEffect, useRef, useState } from 'react'
import {
  armarBackup,
  bajarBackup,
  copiarAlPortapapeles,
  detectarDescarga,
  type ModoDescarga,
} from '../lib/backup'
import type { Receta } from '../lib/types'

interface Props {
  recetas: Receta[]
  onCerrar: () => void
  onImportarTexto: (texto: string) => Promise<void>
}

const pesar = (texto: string) => {
  const bytes = new Blob([texto]).size
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function PanelBackup({ recetas, onCerrar, onImportarTexto }: Props) {
  const [incluirFotos, setIncluirFotos] = useState(true)
  const [json, setJson] = useState('')
  const [armando, setArmando] = useState(true)
  const [modo, setModo] = useState<ModoDescarga>('ninguno')
  const [aviso, setAviso] = useState('')
  const [pegado, setPegado] = useState('')
  const inputArchivo = useRef<HTMLInputElement>(null)
  const cajaJson = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    detectarDescarga().then(setModo)
  }, [])

  useEffect(() => {
    let vivo = true
    setArmando(true)
    armarBackup(recetas, incluirFotos).then((texto) => {
      if (!vivo) return
      setJson(texto)
      setArmando(false)
    })
    return () => {
      vivo = false
    }
  }, [recetas, incluirFotos])

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [onCerrar])

  async function copiar() {
    try {
      await copiarAlPortapapeles(json)
      setAviso('Copiado. Pegalo en un mail o una nota para vos misma.')
    } catch (e) {
      cajaJson.current?.select()
      setAviso(e instanceof Error ? e.message : 'No se pudo copiar.')
    }
  }

  async function bajar() {
    try {
      await bajarBackup(json)
      setAviso('Listo.')
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se pudo bajar el backup.')
    }
  }

  async function importar(texto: string) {
    setAviso('')
    try {
      await onImportarTexto(texto)
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se pudo importar.')
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Backup"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-encabezado">
          <h2 className="modal-titulo">Backup</h2>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <section className="modal-seccion">
          <h3 className="modal-subtitulo">Guardar una copia</h3>
          <p className="modal-texto">
            Las recetas viven solo en este teléfono. Si borrás los datos del navegador, se van.
            Guardate una copia de vez en cuando.
          </p>

          <label className="modal-check">
            <input
              type="checkbox"
              checked={incluirFotos}
              onChange={(e) => setIncluirFotos(e.target.checked)}
            />
            <span>
              Incluir las fotos
              <em className="modal-nota">
                {' '}
                — sin fotos pesa mucho menos y entra en un mensaje
              </em>
            </span>
          </label>

          <div className="modal-acciones">
            <button type="button" className="btn-modal" onClick={copiar} disabled={armando}>
              Copiar
            </button>
            {modo !== 'ninguno' && (
              <button
                type="button"
                className="btn-modal btn-modal-suave"
                onClick={bajar}
                disabled={armando}
              >
                Bajar archivo
              </button>
            )}
            <span className="modal-peso">
              {armando ? 'armando…' : `${recetas.length} receta(s) · ${pesar(json)}`}
            </span>
          </div>

          <textarea
            ref={cajaJson}
            className="modal-json"
            readOnly
            value={armando ? '' : json}
            onFocus={(e) => e.currentTarget.select()}
            rows={4}
            aria-label="Texto del backup"
          />
        </section>

        <section className="modal-seccion">
          <h3 className="modal-subtitulo">Restaurar una copia</h3>

          <textarea
            className="modal-json"
            value={pegado}
            onChange={(e) => setPegado(e.target.value)}
            placeholder="Pegá acá el texto de un backup…"
            rows={3}
            aria-label="Backup a restaurar"
          />

          <div className="modal-acciones">
            <button
              type="button"
              className="btn-modal"
              disabled={!pegado.trim()}
              onClick={() => importar(pegado)}
            >
              Restaurar lo pegado
            </button>
            <button
              type="button"
              className="btn-modal btn-modal-suave"
              onClick={() => inputArchivo.current?.click()}
            >
              Abrir un archivo
            </button>
            <input
              ref={inputArchivo}
              type="file"
              accept="application/json,.json,text/plain"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) await importar(await file.text())
              }}
            />
          </div>
        </section>

        {aviso && (
          <p className="modal-aviso" role="status">
            {aviso}
          </p>
        )}
      </div>
    </div>
  )
}
