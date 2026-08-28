import { useEffect, useRef, useState } from 'react'
import { borrarFoto, cargarFoto, guardarFoto } from '../lib/db'
import { procesarFoto } from '../lib/image'
import { nuevoId } from '../lib/types'

interface Props {
  fotoId: string | null
  onCambiarFoto: (fotoId: string | null) => void
}

export default function FotoReceta({ fotoId, onCambiarFoto }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivo = true
    let objectUrl: string | null = null

    if (!fotoId) {
      setUrl(null)
      return
    }

    cargarFoto(fotoId).then((blob) => {
      if (!vivo || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      vivo = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fotoId])

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setCargando(true)
    setError(null)
    try {
      const blob = await procesarFoto(file)
      const nuevoFotoId = nuevoId()
      await guardarFoto(nuevoFotoId, blob)
      if (fotoId) await borrarFoto(fotoId)
      onCambiarFoto(nuevoFotoId)
    } catch {
      setError('No se pudo procesar la imagen.')
    } finally {
      setCargando(false)
    }
  }

  async function quitar() {
    if (fotoId) await borrarFoto(fotoId)
    onCambiarFoto(null)
  }

  return (
    <div className="foto">
      <button
        type="button"
        className="foto-marco"
        onClick={() => inputRef.current?.click()}
        title={url ? 'Cambiar foto' : 'Subir foto'}
      >
        {url ? (
          <img src={url} alt="Foto del producto final" />
        ) : (
          <span className="foto-vacia">
            <span className="foto-icono" aria-hidden="true">🍰</span>
            <span>{cargando ? 'Procesando…' : 'Subir foto'}</span>
          </span>
        )}
      </button>

      <div className="foto-acciones">
        <button type="button" className="btn-chico" onClick={() => inputRef.current?.click()}>
          {url ? 'Cambiar' : 'Subir foto'}
        </button>
        {url && (
          <button type="button" className="btn-chico btn-peligro" onClick={quitar}>
            Quitar
          </button>
        )}
      </div>

      {error && <p className="foto-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={alElegirArchivo}
      />
    </div>
  )
}
